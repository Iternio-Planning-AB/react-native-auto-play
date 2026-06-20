import { HybridAutoPlay, SearchTemplate } from '@iternio/react-native-auto-play';
import { AutoTemplate } from './AutoTemplate';

const getTemplate = ({
  searchHint,
  onSearchTextChanged,
  onSearchTextSubmitted,
}: {
  searchHint?: string;
  onSearchTextChanged: (searchText: string) => void;
  onSearchTextSubmitted: (searchText: string) => void;
}): SearchTemplate => {
  const template = new SearchTemplate({
    title: { text: 'Search' },
    headerActions: AutoTemplate.headerActions,
    searchHint,
    onSearchTextChanged,
    onSearchTextSubmitted,
    onWillAppear: () => console.log('SearchTemplate onWillAppear', template.id),
    onDidAppear: () => console.log('SearchTemplate onDidAppear', template.id),
    onWillDisappear: () => console.log('SearchTemplate onWillDisappear', template.id),
    onDidDisappear: () => console.log('SearchTemplate onDidDisappear', template.id),
    onPopped: () => console.log('SearchTemplate onPopped', template.id),
    results: {
      type: 'default',
      items: [
        {
          title: { text: 'initial #1' },
          type: 'default',
          onPress: () => {
            console.log('*** initial #1');
            HybridAutoPlay.popTemplate().catch((e) => {
              console.log('*** failed to pop template', e);
            });
          },
        },
      ],
    },
  });

  return template;
};

export const AutoSearchTemplate = { getTemplate };
