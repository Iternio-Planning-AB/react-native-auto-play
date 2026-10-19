const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const test = require('node:test');

const packageRoot = process.env.AUTO_PLAY_PACKAGE_ROOT ?? resolve(__dirname, '..');
const nativeRoot = join(
  packageRoot,
  'android/src/main/java/com/margelo/nitro/swe/iternio/reactnativeautoplay'
);
const compiler = process.env.KOTLINC ?? 'kotlinc';
const runner = process.env.KOTLIN ?? 'kotlin';
const hasKotlin = spawnSync(compiler, ['-version'], { timeout: 10_000 }).status === 0;

test('Android session destruction cleans up car guidance without ending the phone route', {
  skip: !hasKotlin && 'Kotlin CLI is required for the native callback behavior test',
}, () => {
  const sessionSource = readFileSync(join(nativeRoot, 'AndroidAutoSession.kt'), 'utf8');
  const templateSource = readFileSync(join(nativeRoot, 'template/MapTemplate.kt'), 'utf8');
  const lifecycleGetter = sessionSource.match(
    /fun getRootLifecycle\(\): Lifecycle\? \{[\s\S]*?\n {8}\}/
  )?.[0];
  assert.ok(lifecycleGetter, 'capture the session lifecycle before teardown removes the session');
  const callbackStart =
    templateSource.indexOf('if (initNavigationManager) {') + 'if (initNavigationManager) {'.length;
  const callbackEnd = templateSource.indexOf('UiThreadUtil.runOnUiThread', callbackStart);
  assert.ok(callbackEnd > callbackStart);
  const callback = templateSource.slice(callbackStart, callbackEnd);
  const directory = mkdtempSync(join(tmpdir(), 'auto-play-navigation-lifecycle-'));
  const source = `
class Lifecycle(var currentState: State) {
    enum class State { DESTROYED, INITIALIZED, CREATED, STARTED, RESUMED }
}
class AndroidAutoSession(val lifecycle: Lifecycle) {
    class ScreenContext(val session: AndroidAutoSession)
    companion object {
        const val ROOT_SESSION = "AutoPlayRoot"
        val sessions = mutableMapOf<String, ScreenContext>()
        ${lifecycleGetter}
    }
}
interface NavigationManagerCallback {
    fun onAutoDriveEnabled()
    fun onStopNavigation()
}
class Config {
    var stops = 0
    val onAutoDriveEnabled: (() -> Unit)? = null
    fun onStopNavigation() { stops += 1 }
}
class Template(val config: Config) {
    var nativeStops = 0
    fun navigationEnded() { nativeStops += 1 }
    fun createCallback(): NavigationManagerCallback {
        ${callback}
        return navigationManagerCallback
    }
}
fun main() {
    // A hidden/paused session must still honor cancellation by another navigator.
    for (state in listOf(Lifecycle.State.CREATED, Lifecycle.State.STARTED, Lifecycle.State.RESUMED)) {
        val session = AndroidAutoSession(Lifecycle(state))
        AndroidAutoSession.sessions[AndroidAutoSession.ROOT_SESSION] = AndroidAutoSession.ScreenContext(session)
        val config = Config()
        val template = Template(config)
        template.createCallback().onStopNavigation()
        check(config.stops == 1) { "Live host cancellation must stop the shared route: $state" }
        check(template.nativeStops == 1)
    }

    for (reconnect in listOf(false, true)) {
        val session = AndroidAutoSession(Lifecycle(Lifecycle.State.RESUMED))
        AndroidAutoSession.sessions[AndroidAutoSession.ROOT_SESSION] = AndroidAutoSession.ScreenContext(session)
        val config = Config()
        val template = Template(config)
        val callback = template.createCallback()
        session.lifecycle.currentState = Lifecycle.State.DESTROYED
        AndroidAutoSession.sessions.remove(AndroidAutoSession.ROOT_SESSION)
        if (reconnect) {
            val replacement = AndroidAutoSession(Lifecycle(Lifecycle.State.RESUMED))
            AndroidAutoSession.sessions[AndroidAutoSession.ROOT_SESSION] = AndroidAutoSession.ScreenContext(replacement)
        }
        callback.onStopNavigation()
        check(config.stops == 0) { "Destruction must preserve the phone route, including after reconnect" }
        check(template.nativeStops == 1) { "Car guidance must still be cleaned up" }
    }
    println("Android navigation lifecycle behavior passed")
}
`;

  try {
    const file = join(directory, 'NavigationLifecycle.kt');
    const classes = join(directory, 'classes');
    writeFileSync(file, source);
    const compiled = spawnSync(compiler, [file, '-d', classes], {
      encoding: 'utf8',
      timeout: 60_000,
    });
    assert.equal(compiled.status, 0, compiled.stderr || compiled.error?.message);
    const result = spawnSync(runner, ['-classpath', classes, 'NavigationLifecycleKt'], {
      encoding: 'utf8',
      timeout: 10_000,
    });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    assert.match(result.stdout, /Android navigation lifecycle behavior passed/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('Android navigation uses a stable descriptive notification channel name', {
  skip: !hasKotlin && 'Kotlin CLI is required for the native channel behavior test',
}, () => {
  const service = readFileSync(join(nativeRoot, 'AndroidAutoService.kt'), 'utf8');
  const channel = service.match(/NotificationChannel\(\s*CHANNEL_ID,[\s\S]*?\n\s*\)/)?.[0];
  const channelId = service.match(/private const val CHANNEL_ID = "([^"]+)"/)?.[1];
  assert.ok(channel, 'Read the actual channel configuration');
  assert.equal(channelId, 'AutoPlayServiceChannel', 'Preserve the existing channel identity');
  const directory = mkdtempSync(join(tmpdir(), 'autoplay-notification-channel-'));
  const source = `
class NotificationChannel(val id: String, val name: CharSequence, val importance: Int)
class NotificationManager {
    companion object { const val IMPORTANCE_DEFAULT = 3 }
}
fun main() {
    val CHANNEL_ID = "${channelId}"
    val appLabel = "Dev | Example"
    val channel = ${channel}
    check(channel.id == "AutoPlayServiceChannel")
    check(channel.name.toString() == "Android Auto Navigation")
    check(channel.importance == 3)
    println("Android notification channel behavior passed")
}
`;
  try {
    const file = join(directory, 'NotificationChannel.kt');
    const classes = join(directory, 'classes');
    writeFileSync(file, source);
    const compiled = spawnSync(compiler, [file, '-d', classes], {
      encoding: 'utf8',
      timeout: 60000,
    });
    assert.equal(compiled.status, 0, compiled.stderr || compiled.error?.message);
    const result = spawnSync(runner, ['-classpath', classes, 'NotificationChannelKt'], {
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    assert.match(result.stdout, /Android notification channel behavior passed/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
