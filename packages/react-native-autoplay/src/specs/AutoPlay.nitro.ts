import type { HybridObject } from 'react-native-nitro-modules';
import type { AlertTemplateConfig } from '../templates/AlertTemplate';
import type { NitroGridTemplateConfig } from '../templates/GridTemplate';
import type { NitroListTemplateConfig } from '../templates/ListTemplate';
import type { NitroMapTemplateConfig } from '../templates/MapTemplate';
import type { TemplateConfig } from '../templates/Template';
import type { CleanupCallback, EventName, SafeAreaInsets, VisibilityState } from '../types/Event';
import type { TripConfig, TripPreviewTextConfiguration } from '../types/Trip';
import type { NitroAction } from '../utils/NitroAction';
import type { NitroNavigationAlert } from '../utils/NitroAlert';
import type { NitroGridButton } from '../utils/NitroGrid';
import type { NitroMapButton } from '../utils/NitroMapButton';

interface NitroTemplateConfig extends TemplateConfig {
  id: string;
}
// using type Nitro....Config = ...Config & NitroTemplateConfig does not work out for nitrogen
interface MapTemplateConfig extends NitroTemplateConfig, NitroMapTemplateConfig {}
interface ListTemplateConfig extends NitroTemplateConfig, NitroListTemplateConfig {}
interface GridTemplateConfig extends NitroTemplateConfig, NitroGridTemplateConfig {}

export interface AutoPlay extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  /**
   * attach a listener for generic notifications like didConnect, didDisconnect, ...
   * @namespace all
   * @param eventType generic events
   * @returns token to remove the listener
   */
  addListener(eventType: EventName, callback: () => void): CleanupCallback;

  /**
   * adds a listener for the session/scene state
   * fires willAppear & didAppear when the scene/session is visible
   * fires willDisappear & didDisappear when the scene/session is not visible
   * @param mapTemplateId actually type of MapTemplateId but we can not use that one on nitro
   */
  addListenerRenderState(
    mapTemplateId: string,
    callback: (payload: VisibilityState) => void
  ): CleanupCallback;

  /**
   * @namespace iOS // add similar thing for Android, probably a MessageTemplate then?
   */
  createAlertTemplate(config: AlertTemplateConfig): void;
  /**
   * @namespace iOS
   */
  presentTemplate(templateId: string): void;
  /**
   * @namespace iOS
   */
  dismissTemplate(templateId: string): void;

  /**
   * creates a map template that can render any react component
   * @returns a cleanup function, eg: removes attached listeners
   */
  createMapTemplate(config: MapTemplateConfig): void;
  showNavigationAlert(templateId: string, alert: NitroNavigationAlert): void;
  showTripSelector(
    templateId: string,
    trips: Array<TripConfig>,
    selectedTripId: string | null,
    textConfig: TripPreviewTextConfiguration,
    onTripSelected: (tripId: string, routeId?: string) => void
  ): void;
  hideTripSelector(templateId: string): void;

  createListTemplate(config: ListTemplateConfig): void;
  updateListTemplateSections(
    templateId: string,
    sections: NitroListTemplateConfig['sections']
  ): void;

  createGridTemplate(config: GridTemplateConfig): void;
  updateGridTemplateButtons(templateId: string, buttons: Array<NitroGridButton>): void;

  /**
   * sets the specified template as root template, initializes a new stack
   * Promise might contain an error message in case setting root template failed
   * can be used on any Android screen/iOS scene
   */
  setRootTemplate(templateId: string): Promise<void>;

  /**
   * push a template to the AutoPlayRoot Android screen/iOS scene
   */
  pushTemplate(templateId: string): Promise<void>;

  /**
   * remove the top template from the stack
   */
  popTemplate(): Promise<void>;

  /**
   * remove all templates from the stack except the root template
   */
  popToRootTemplate(): Promise<void>;

  /**
   * removes all templates until the specified one is the top template
   */
  popToTemplate(templateId: string): Promise<void>;

  /**
   * callback for safe area insets changes
   * @param insets the insets that you use to determine the safe area for this view.
   */
  addSafeAreaInsetsListener(
    moduleName: string,
    callback: (insets: SafeAreaInsets) => void
  ): CleanupCallback;

  /**
   * update the map buttons on a map template
   */
  setTemplateMapButtons(templateId: string, buttons?: Array<NitroMapButton>): void;

  /**
   * update a templates actions
   */
  setTemplateActions(templateId: string, actions?: Array<NitroAction>): void;
}
