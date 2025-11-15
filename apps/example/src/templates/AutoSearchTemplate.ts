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
  return new SearchTemplate({
    title: { text: 'Search' },
    headerActions: AutoTemplate.headerActions,
    searchHint,
    onSearchTextChanged,
    onSearchTextSubmitted,
    onWillAppear: () => console.log('SearchTemplate onWillAppear'),
    onDidAppear: () => console.log('SearchTemplate onDidAppear'),
    onWillDisappear: () => console.log('SearchTemplate onWillDisappear'),
    onDidDisappear: () => console.log('SearchTemplate onDidDisappear'),
    onPopped: () => console.log('SearchTemplate onPopped'),
    results: {
      type: 'default',
      items: [
        {
          title: { text: 'initial #1' },
          type: 'default',
          onPress: () => {
            console.log('*** initial #1');
            HybridAutoPlay.popTemplate();
          },
        },
      ],
    },
  });
};

export const AutoSearchTemplate = { getTemplate };
