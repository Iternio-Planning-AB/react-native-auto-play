import { Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type {
  ActionButton,
  AppButton,
  BackButton,
  CustomActionButtonAndroid,
  ImageButton,
} from '..';
import type { SignInTemplate as NitroSignInTemplate } from '../specs/SignInTemplate.nitro';
import { type SignInMethod, SignInMethods } from '../types/SignInMethod';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type NitroTemplateConfig, Template, type TemplateConfig } from './Template';

export const HybridSignInTemplate =
  Platform.OS === 'android'
    ? NitroModules.createHybridObject<NitroSignInTemplate>('SignInTemplate')
    : null;

export interface NitroSignInTemplateConfig extends TemplateConfig {
  title?: string;
  additionalText?: string;
  signInMethod?: SignInMethod;
  headerActions?: Array<NitroAction>;
  actions?: Array<NitroAction>;
  instructions?: string;
}

export type SignInHeaderActions<T> = {
  android: {
    startHeaderAction?: AppButton | BackButton<T>;
    /**
     * Actions for the sign-in template.
     * Note: Android Auto only allows 1 action with a custom title in the action strip.
     */
    endHeaderActions?:
      | [CustomActionButtonAndroid<SignInTemplate>, ImageButton<SignInTemplate>]
      | [ImageButton<SignInTemplate>, CustomActionButtonAndroid<SignInTemplate>]
      | [CustomActionButtonAndroid<SignInTemplate>];
  };
};

export type SignInTemplateConfig = Omit<
  NitroSignInTemplateConfig,
  'headerActions' | 'actions' | 'signInMethod'
> & {
  headerActions?: SignInHeaderActions<SignInTemplate>;
  actions?: Array<ActionButton<SignInTemplate>>;
  signInMethod: SignInMethod;
};

export type SignInTemplateUpdateConfig = Omit<
  NitroSignInTemplateConfig,
  'headerActions' | 'actions'
> & {
  headerActions?: SignInHeaderActions<SignInTemplate>;
  actions?: Array<ActionButton<SignInTemplate>>;
};

/**
 * A template for signing in to an account.
 * @namespace Android
 */
export class SignInTemplate extends Template<
  SignInTemplateConfig,
  SignInHeaderActions<SignInTemplate>
> {
  private template = this;

  constructor(config: SignInTemplateConfig) {
    super(config);

    const { headerActions, actions, ...rest } = config;

    const nitroConfig: NitroSignInTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, headerActions),
      actions: NitroActionUtil.convert(this.template, actions),
    };

    if (
      config.signInMethod.method === SignInMethods.PIN &&
      (config.signInMethod.pin?.length > 12 || config.signInMethod.pin?.length < 1)
    ) {
      throw new Error('PIN must be 1-12 characters');
    }

    HybridSignInTemplate?.createSignInTemplate(nitroConfig);
  }

  /**
   * Updates the template with new config. The config is merged with the current one,
   * so if values are not provided, they will stay. To change values, they need to be overridden.
   *
   * @param updatedConfig - The updated config for the template.
   * @returns A promise that resolves when the template is updated.
   */
  updateTemplate(updatedConfig: SignInTemplateUpdateConfig) {
    this.assertConnected();

    const { headerActions, actions, ...rest } = updatedConfig;
    const nitroConfig: NitroSignInTemplateConfig & NitroTemplateConfig = {
      ...rest,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, headerActions),
      actions: NitroActionUtil.convert(this.template, actions),
    };

    if (
      nitroConfig.signInMethod?.method === SignInMethods.PIN &&
      (nitroConfig.signInMethod.pin?.length > 12 || nitroConfig.signInMethod.pin?.length < 1)
    ) {
      throw new Error('PIN must be 1-12 characters');
    }

    return HybridSignInTemplate?.updateTemplate(this.id, nitroConfig);
  }
}
