import {
  HybridAutoPlay,
  KeyboardType,
  SignInMethods,
  SignInTemplate,
  type SignInTemplateConfig,
  TextInputType,
} from '@iternio/react-native-auto-play';

const getDefaultConfig = (signInFinished: () => void): Partial<SignInTemplateConfig> => ({
  headerActions: {
    android: {
      startHeaderAction: { type: 'appIcon' },
      endHeaderActions: [
        {
          type: 'image',
          image: { name: 'cancel', type: 'glyph' },
          onPress: () => {
            void HybridAutoPlay.popTemplate();
            signInFinished();
          },
        },
        {
          type: 'textImage',
          title: 'Ok',
          image: { name: 'check', type: 'glyph' },
          onPress: () => {
            void HybridAutoPlay.popTemplate();
            signInFinished();
          },
        },
      ],
    },
  },
  onWillAppear: () => console.log('SignInTemplate onWillAppear'),
  onDidAppear: () => console.log('SignInTemplate onDidAppear'),
  onWillDisappear: () => console.log('SignInTemplate onWillDisappear'),
  onDidDisappear: () => console.log('SignInTemplate onDidDisappear'),
  onPopped: () => console.log('SignInTemplate onPopped'),
});

const getQrSignInConfig = (signInFinished: () => void): SignInTemplateConfig => {
  const config: SignInTemplateConfig = {
    title: 'Sign In with QR',
    additionalText: 'Scan the QR code with the companion app to sign in',
    signInMethod: {
      method: SignInMethods.QR,
      url: 'https://abetterrouteplanner.com',
    },
    actions: [
      {
        type: 'textImage',
        image: {
          name: 'dialpad',
          type: 'glyph',
        },
        title: 'PIN sign in',
        onPress: () => {
          const conf: SignInTemplateConfig = {
            ...getDefaultConfig(signInFinished),
            ...getPinSignInConfig(signInFinished),
          };
          template?.updateTemplate(conf);
        },
      },
      {
        type: 'textImage',
        image: {
          name: 'mail',
          type: 'glyph',
        },
        title: 'Mail sign in',
        onPress: () => {
          const conf: SignInTemplateConfig = {
            ...getDefaultConfig(signInFinished),
            ...getInputSignInConfig(signInFinished),
          };
          template?.updateTemplate(conf);
        },
      },
    ],
  };

  return config;
};

const getPinSignInConfig = (signInFinished: () => void): SignInTemplateConfig => {
  const config: SignInTemplateConfig = {
    title: 'Sign In with PIN',
    additionalText: 'Enter the PIN code in the companion app to sign in',
    signInMethod: {
      method: SignInMethods.PIN,
      pin: '123456',
    },
    actions: [
      {
        type: 'textImage',
        image: {
          name: 'qr_code_scanner',
          type: 'glyph',
        },
        title: 'QR sign in',
        onPress: () => {
          const conf: SignInTemplateConfig = {
            ...getDefaultConfig(signInFinished),
            ...getQrSignInConfig(signInFinished),
          };
          template?.updateTemplate(conf);
        },
      },
      {
        type: 'textImage',
        image: {
          name: 'mail',
          type: 'glyph',
        },
        title: 'Mail sign in',
        onPress: () => {
          const conf: SignInTemplateConfig = {
            ...getDefaultConfig(signInFinished),
            ...getInputSignInConfig(signInFinished),
          };
          template?.updateTemplate(conf);
        },
      },
    ],
  };

  return config;
};

const getInputSignInConfig = (signInFinished: () => void, mail?: string): SignInTemplateConfig => {
  const config: SignInTemplateConfig = {
    title: 'Sign In with Input',
    additionalText: mail ? `Enter password for ${mail}` : 'Enter your email to sign in',
    signInMethod: {
      method: SignInMethods.INPUT,
      keyboardType: mail ? KeyboardType.DEFAULT : KeyboardType.EMAIL,
      hint: mail ? 'Enter your password' : 'Enter your email',
      inputType: mail ? TextInputType.PASSWORD : TextInputType.DEFAULT,
      callback: (inputText: string) => {
        if (mail) {
          console.log(`*** mail: ${mail}, password: ${inputText}`);
          void HybridAutoPlay.popToRootTemplate();
          signInFinished();
          return;
        }

        const conf: SignInTemplateConfig = {
          ...getDefaultConfig(signInFinished),
          ...getInputSignInConfig(signInFinished, inputText),
        };
        template?.updateTemplate(conf);
      },
    },
    actions: [
      {
        type: 'textImage',
        image: {
          name: 'qr_code_scanner',
          type: 'glyph',
        },
        title: 'QR sign in',
        onPress: () => {
          const conf: SignInTemplateConfig = {
            ...getDefaultConfig(signInFinished),
            ...getQrSignInConfig(signInFinished),
          };
          template?.updateTemplate(conf);
        },
      },
      {
        type: 'textImage',
        image: {
          name: 'dialpad',
          type: 'glyph',
        },
        title: 'PIN sign in',
        onPress: () => {
          const conf: SignInTemplateConfig = {
            ...getDefaultConfig(signInFinished),
            ...getPinSignInConfig(signInFinished),
          };
          template?.updateTemplate(conf);
        },
      },
    ],
  };

  return config;
};

let template: SignInTemplate | undefined;

const getTemplate = (signInFinished: () => void): SignInTemplate => {
  const config: SignInTemplateConfig = {
    ...getDefaultConfig(signInFinished),
    ...getQrSignInConfig(signInFinished),
  };
  template = new SignInTemplate(config);

  return template;
};

export const AutoSignInTemplate = { getTemplate };
