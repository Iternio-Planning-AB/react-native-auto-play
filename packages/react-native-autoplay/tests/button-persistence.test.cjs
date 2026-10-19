const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = process.env.AUTO_PLAY_PACKAGE_ROOT ?? resolve(__dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

function load(path, dependencies) {
  const { outputText } = ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const context = vm.createContext({
    __DEV__: false,
    exports: {},
    require: (name) => dependencies[name] ?? {},
  });
  vm.runInContext(outputText, context);
  return context.exports;
}

function method(source, token) {
  const start = source.indexOf(token);
  assert.ok(start >= 0, `Missing ${token}`);
  const opening = source.indexOf('{', start);
  let depth = 1;
  let end = opening + 1;
  while (depth > 0) {
    assert.ok(end < source.length, `Unclosed ${token}`);
    if (source[end] === '{') {
      depth++;
    } else if (source[end] === '}') {
      depth--;
    }
    end++;
  }
  return source.slice(start, end);
}

for (const platform of ['android', 'ios']) {
  for (const type of ['custom', 'pan']) {
    for (const image of [
      { type: 'glyph', name: 'location' },
      { type: 'asset', image: 7 },
    ]) {
      for (const flags of [undefined, 0, 2, 3]) {
        test(`${platform} ${type} ${image.type} preserves flags ${flags}`, () => {
          const { NitroMapButton } = load('src/utils/NitroMapButton.ts', {
            'react-native': { Platform: { OS: platform } },
            './NitroImage': { NitroImageUtil: { convert: (value) => value } },
          });
          const template = {};
          let pressed;
          const button = {
            type,
            image,
            onPress: (value) => {
              pressed = value;
            },
          };
          if (flags !== undefined) {
            button.flags = flags;
          }
          const [converted] = NitroMapButton.convert(template, [button]);
          assert.equal(converted.flags, flags);
          assert.equal(converted.type, type);
          if (type === 'custom') {
            converted.onPress();
            assert.equal(pressed, template);
          } else {
            assert.equal(converted.onPress, undefined);
          }
          if (image.type === 'glyph') {
            assert.equal(converted.image.fontScale, platform === 'android' ? 1 : 0.65);
          }
          assert.equal(NitroMapButton.convert(template), undefined);
        });
      }
    }
  }
}

test('map creation, replacements and trip previews forward flags and CarPlay options', () => {
  const calls = [];
  const hybrid = new Proxy(
    {},
    {
      get:
        (_, name) =>
        (...args) => {
          calls.push([name, ...args]);
        },
    }
  );
  const { NitroMapButton } = load('src/utils/NitroMapButton.ts', {
    'react-native': { Platform: { OS: 'android' } },
    './NitroImage': { NitroImageUtil: { convert: (value) => value } },
  });
  const { MapTemplate } = load('src/templates/MapTemplate.ts', {
    'react-native': { Platform: { OS: 'android' }, AppRegistry: { registerComponent() {} } },
    'react-native-nitro-modules': { NitroModules: { createHybridObject: () => hybrid } },
    './Template': {
      Template: class {
        constructor(config) {
          this.id = config.id;
        }
      },
    },
    '../utils/NitroMapButton': { NitroMapButton },
    '../utils/NitroAction': { NitroActionUtil: { convert: () => undefined } },
  });
  const button = (flags) => ({
    type: 'custom',
    flags,
    image: { type: 'asset', image: 7 },
    onPress() {},
  });
  const map = new MapTemplate({
    component() {},
    onStopNavigation() {},
    automaticallyHidesNavigationBar: false,
    hidesButtonsWithNavigationBar: false,
    mapButtons: [button(2)],
  });
  assert.equal(calls[0][0], 'createMapTemplate');
  assert.equal(calls[0][1].mapButtons[0].flags, 2);
  assert.equal(calls[0][1].automaticallyHidesNavigationBar, false);
  assert.equal(calls[0][1].hidesButtonsWithNavigationBar, false);
  map.setMapButtons([button(0)]);
  assert.equal(calls.at(-1)[0], 'setTemplateMapButtons');
  assert.equal(calls.at(-1)[2][0].flags, 0);
  map.showTripSelector({
    trips: [{ routeChoices: [{ steps: [{}, {}] }] }],
    mapButtons: [button(3)],
    textConfig: {},
    onTripSelected() {},
    onTripStarted() {},
    onBackPressed() {},
  });
  assert.equal(calls.at(-1)[0], 'showTripSelector');
  assert.equal(calls.at(-1).at(-1)[0].flags, 3);
});

test('map-content conversion forwards map-button flags', () => {
  const { NitroMapButton } = load('src/utils/NitroMapButton.ts', {
    'react-native': { Platform: { OS: 'android' } },
    './NitroImage': { NitroImageUtil: { convert: (value) => value } },
  });
  const { NitroMapConfigUtil } = load('src/utils/NitroMapConfig.ts', {
    'react-native': { Platform: { OS: 'android' } },
    './NitroMapButton': { NitroMapButton },
    './NitroAction': { NitroActionUtil: { convert: () => undefined } },
  });
  const converted = NitroMapConfigUtil.convert(
    {},
    {
      mapButtons: [{ type: 'pan', flags: 2, image: { type: 'asset', image: 7 } }],
    }
  );
  assert.equal(converted.mapButtons[0].flags, 2);
});

test('Android cluster construction supplies every generated map-config field', () => {
  const generated = read(
    'nitrogen/generated/android/kotlin/com/margelo/nitro/swe/iternio/reactnativeautoplay/MapTemplateConfig.kt'
  );
  const session = read(
    'android/src/main/java/com/margelo/nitro/swe/iternio/reactnativeautoplay/AndroidAutoSession.kt'
  );
  const config = session.slice(
    session.indexOf('val config = MapTemplateConfig('),
    session.indexOf('val template = MapTemplate(')
  );
  for (const [, field] of generated.matchAll(/ {2}val (\w+):/g)) {
    assert.match(config, new RegExp(`\\b${field} =`), `Cluster constructor must provide ${field}`);
  }
});

test('Android applies flags to custom and pan actions without changing strip ordering', () => {
  const source = read(
    'android/src/main/java/com/margelo/nitro/swe/iternio/reactnativeautoplay/template/Parser.kt'
  );
  const parser = method(source, 'fun parseMapActions(');
  assert.match(parser, /buttons.sortBy/);
  const pan = parser.slice(parser.indexOf('if (button.type'), parser.indexOf('return@forEach'));
  assert.match(pan, /Action.Builder\(Action.PAN\)/);
  assert.match(pan, /button.flags\?\.let \{ flags ->\s*setFlags\(flags.toInt\(\)\)/);
  const custom = parser.slice(parser.indexOf('return@forEach'));
  assert.match(custom, /button.flags\?\.let \{ flags ->\s*setFlags\(flags.toInt\(\)\)/);
  assert.match(source, /setMapActionStrip\(parseMapActions\(context, mapButtons\)\)/);
  assert.match(
    read(
      'android/src/main/java/com/margelo/nitro/swe/iternio/reactnativeautoplay/template/MapTemplate.kt'
    ),
    /setMapActionStrip\(Parser.parseMapActions\(context, buttons\)\)/
  );
});

const compiler = process.env.KOTLINC ?? 'kotlinc';
const runner = process.env.KOTLIN ?? 'kotlin';

test('Android map actions preserve flags, order, icons and callbacks', {
  skip:
    spawnSync(compiler, ['-version']).status !== 0 &&
    'Kotlin CLI is required for this behavior test',
}, () => {
  const parser = method(
    read(
      'android/src/main/java/com/margelo/nitro/swe/iternio/reactnativeautoplay/template/Parser.kt'
    ),
    'fun parseMapActions('
  );
  const directory = mkdtempSync(join(tmpdir(), 'autoplay-map-actions-'));
  const kotlin = `
class CarContext
class Action(val type: String, val icon: String?, val flags: Int, val onPress: (() -> Unit)?) {
    companion object { val PAN = Action("pan", null, 0, null) }
    class Builder(val source: Action? = null) {
        var icon: String? = null
        var flags = 0
        var onPress: (() -> Unit)? = null
        fun setIcon(value: String) = apply { icon = value }
        fun setFlags(value: Int) = apply { flags = value }
        fun setOnClickListener(value: () -> Unit) = apply { onPress = value }
        fun build() = Action(source?.type ?: "custom", icon, flags, onPress)
    }
}
class ActionStrip(val actions: List<Action>) {
    class Builder {
        val actions = mutableListOf<Action>()
        fun addAction(action: Action) = apply { actions.add(action) }
        fun build() = ActionStrip(actions.toList())
    }
}
enum class NitroMapButtonType { PAN, CUSTOM }
class NitroMapButton(val type: NitroMapButtonType, val image: String, val flags: Double?, val onPress: (() -> Unit)? = null)
object Parser {
    fun parseImage(context: CarContext, image: String) = image
    ${parser}
}
fun main() {
    var presses = 0
    for (flags in listOf(null, 0.0, 2.0, 3.0)) {
        val buttons = arrayOf(
            NitroMapButton(NitroMapButtonType.CUSTOM, "recenter", flags) { presses++ },
            NitroMapButton(NitroMapButtonType.PAN, "pan", flags),
            NitroMapButton(NitroMapButtonType.CUSTOM, "zoom", null) { presses++ }
        )
        val strip = Parser.parseMapActions(CarContext(), buttons)
        check(strip.actions.map { it.icon } == listOf("pan", "recenter", "zoom"))
        check(strip.actions[0].type == "pan")
        check(strip.actions[0].flags == (flags?.toInt() ?: 0))
        check(strip.actions[1].flags == (flags?.toInt() ?: 0))
        check(strip.actions[2].flags == 0)
        strip.actions[1].onPress!!()
        strip.actions[2].onPress!!()
    }
    check(presses == 8)
    println("Android map action behavior passed")
}
`;
  try {
    const file = join(directory, 'MapActions.kt');
    const classes = join(directory, 'classes');
    writeFileSync(file, kotlin);
    const compiled = spawnSync(compiler, [file, '-d', classes], {
      encoding: 'utf8',
      timeout: 60000,
    });
    assert.equal(compiled.status, 0, compiled.stderr || compiled.error?.message);
    const result = spawnSync(runner, ['-classpath', classes, 'MapActionsKt'], {
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    assert.match(result.stdout, /Android map action behavior passed/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('CarPlay restores configured visibility after panels, panning and refreshes', {
  skip:
    spawnSync('swift', ['--version']).status !== 0 &&
    'Swift CLI is required for this behavior test',
}, () => {
  const source = read('ios/templates/MapTemplate.swift');
  const initialization = source.match(
    / {8}template\.automaticallyHidesNavigationBar = config\.[^\n]+\n {8}template\.hidesButtonsWithNavigationBar = config\.[^\n]+/
  );
  assert.ok(initialization, 'Apply visibility at creation, before the first refresh');
  const invalidate = method(source, 'override func _invalidate()');
  const directory = mkdtempSync(join(tmpdir(), 'autoplay-visibility-'));
  const swift = `
import Foundation
struct MapTemplateConfig {
    var automaticallyHidesNavigationBar: Bool?
    var hidesButtonsWithNavigationBar: Bool?
}
enum ButtonType { case pan, custom }
struct Button { var type: ButtonType }
class CPBarButton { init(title: String, handler: (CPBarButton) -> Void) {} }
class CPMapTemplate {
    var automaticallyHidesNavigationBar = true
    var hidesButtonsWithNavigationBar = true
    var leadingNavigationBarButtons: [String] = []
    var trailingNavigationBarButtons: [String] = []
    var backButton: CPBarButton?
    var mapButtons: [Button] = []
    func dismissPanningInterface(animated: Bool) {}
}
class Controller { var panelTemplateIds: [String] = [] }
class Scene { var interfaceController: Controller? = Controller() }
class SceneStore {
    static let scene = Scene()
    static func getRootScene() -> Scene? { scene }
}
class AutoPlayTemplate {}
class RootModule {
    static func withAutoPlayTemplate(templateId: String, body: (AutoPlayTemplate) -> Void) throws {
        body(AutoPlayTemplate())
    }
}
class Parser {
    static func parseMapButtons(mapButtons: [Button], onPanButtonPress: () -> Void) -> [Button] { mapButtons }
}
func reapplyPanelBarIfVisible(_ panel: AutoPlayTemplate, templateId: String) {
    panelReapplications += 1
}
var panelReapplications = 0
class Base { func _invalidate() {} }
class Harness: Base {
    let template = CPMapTemplate()
    var config: MapTemplateConfig
    var tripSelectorVisible = false
    var isPanningInterfaceVisible = false
    var barButtons: [String] = []
    var mapButtons: [Button]? = [Button(type: .pan), Button(type: .custom)]
    init(_ config: MapTemplateConfig) {
        self.config = config
        ${initialization[0]}
    }
    func onPanButtonPress() {}
    func setBarButtons(template: CPMapTemplate, barButtons: [String]) {}
    ${invalidate}
}
for bar in [nil, true, false] as [Bool?] {
    for buttons in [nil, true, false] as [Bool?] {
        let harness = Harness(MapTemplateConfig(automaticallyHidesNavigationBar: bar, hidesButtonsWithNavigationBar: buttons))
        func checkPolicy() {
            precondition(harness.template.automaticallyHidesNavigationBar == (bar ?? true))
            precondition(harness.template.hidesButtonsWithNavigationBar == (buttons ?? true))
        }
        checkPolicy()
        harness._invalidate()
        checkPolicy()
        SceneStore.scene.interfaceController?.panelTemplateIds = ["panel"]
        harness.template.automaticallyHidesNavigationBar = false
        harness.template.hidesButtonsWithNavigationBar = false
        harness._invalidate()
        precondition(!harness.template.automaticallyHidesNavigationBar)
        precondition(!harness.template.hidesButtonsWithNavigationBar)
        harness.isPanningInterfaceVisible = true
        harness._invalidate()
        precondition(harness.template.mapButtons.count == 1)
        harness.isPanningInterfaceVisible = false
        harness._invalidate()
        SceneStore.scene.interfaceController?.panelTemplateIds = []
        harness._invalidate()
        checkPolicy()
        harness.tripSelectorVisible = true
        harness._invalidate()
        checkPolicy()
        harness.tripSelectorVisible = false
        harness._invalidate()
        checkPolicy()
    }
}
precondition(panelReapplications == 18)
print("CarPlay visibility behavior passed")
`;
  try {
    const file = join(directory, 'Visibility.swift');
    writeFileSync(file, swift);
    const result = spawnSync('swift', ['-module-cache-path', join(directory, 'cache'), file], {
      encoding: 'utf8',
      timeout: 60000,
    });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    assert.match(result.stdout, /CarPlay visibility behavior passed/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
