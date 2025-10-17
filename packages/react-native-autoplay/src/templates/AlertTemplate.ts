import { HybridAutoPlay } from '..';
import { Template, type TemplateConfig } from './Template';

export type AlertStyle = 'default' | 'cancel' | 'destructive';

export interface AlertAction {
  title: string;
  style?: AlertStyle;
  onPress: () => void;
}

export interface AlertTemplateConfig extends TemplateConfig {
  titleVariants: string[];
  headerActions?: AlertAction[];
}

export class AlertTemplate extends Template<AlertTemplateConfig, undefined> {
  constructor(config: AlertTemplateConfig) {
    super(config);

    HybridAutoPlay.createAlertTemplate(config);
  }

  public present() {
    HybridAutoPlay.presentTemplate(this.id);
  }

  public dismiss() {
    HybridAutoPlay.dismissTemplate(this.id);
  }
}
