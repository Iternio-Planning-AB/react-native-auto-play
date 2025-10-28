import { SearchTemplate } from '@g4rb4g3/react-native-autoplay/lib/templates/SearchTemplate';
import { AutoTemplate } from './AutoTemplate';

const getTemplate = ({
  initialSearchText,
  searchHint,
  onSearchTextChanged,
  onSearchTextSubmitted,
}: {
  initialSearchText?: string;
  searchHint?: string;
  onSearchTextChanged?: (searchText: string) => void;
  onSearchTextSubmitted?: (searchText: string) => void;
}): SearchTemplate => {
  return new SearchTemplate({
    title: { text: 'Search' },
    headerActions: AutoTemplate.headerActions,
    initialSearchText,
    searchHint,
    onSearchTextChanged,
    onSearchTextSubmitted,
    onWillAppear: () => console.log('SearchTemplate onWillAppear'),
    onDidAppear: () => console.log('SearchTemplate onDidAppear'),
    onWillDisappear: () => console.log('SearchTemplate onWillDisappear'),
    onDidDisappear: () => console.log('SearchTemplate onDidDisappear'),
    onPopped: () => console.log('SearchTemplate onPopped'),
  });
};

export const AutoSearchTemplate = { getTemplate };
