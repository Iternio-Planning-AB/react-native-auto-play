import { AutoPlay } from '..';
import { Template, type TemplateConfig } from './Template';

export type AlertStyle = 'default' | 'cancel' | 'destructive';

export interface AlertAction {
  title: string;
  style?: AlertStyle;
  onPress: () => void;
}

export interface AlertTemplateConfig extends TemplateConfig {
  titleVariants: string[];
  actions?: AlertAction[];
}

export class AlertTemplate extends Template<AlertTemplateConfig, undefined> {
  public get type(): string {
    return 'alert';
  }

  constructor(config: AlertTemplateConfig) {
    super(config);

    AutoPlay.createAlertTemplate(config);
  }

  public present() {
    AutoPlay.presentTemplate(this.templateId);
  }

  public dismiss() {
    AutoPlay.dismissTemplate(this.templateId);
  }
}
