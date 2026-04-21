import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JobCard } from '../../components/JobCard';
import { AppBar, Icon, SectionLabel } from '../../design/components';
import { fonts, radii, spacing, type ThemeColors, useColors } from '../../design/tokens';
import {
  activeFilterCount,
  EMPTY_FILTERS,
  filtersAreEmpty,
  searchJobs,
  type SearchFilters,
  type SearchHit,
} from './searchApi';
import { SearchFiltersModal } from './SearchFiltersModal';
import { useRecentSearches } from './useRecentSearches';
import { STATUS_OPTIONS } from '../jobs/statusOptions';

interface SearchScreenProps {
  onOpenJob(id: number): void;
}

const DEBOUNCE_MS = 280;

export function SearchScreen({ onOpenJob }: SearchScreenProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { recents, push, clear } = useRecentSearches();
  const latestReqRef = useRef(0);

  const runSearch = useCallback(
    async (q: string, f: SearchFilters) => {
      const trimmed = q.trim();
      const empty = filtersAreEmpty(f);
      if (!trimmed && empty) {
        setHits([]);
        setLastQuery('');
        setError(null);
        setLoading(false);
        return;
      }
      const reqId = ++latestReqRef.current;
      setLoading(true);
      setError(null);
      try {
        const results = await searchJobs(trimmed, f);
        if (reqId !== latestReqRef.current) return;
        setHits(results);
        setLastQuery(trimmed);
      } catch (e) {
        if (reqId !== latestReqRef.current) return;
        setError(e instanceof Error ? e.message : 'Search failed');
      } finally {
        if (reqId === latestReqRef.current) setLoading(false);
      }
    },
    [],
  );

  // Debounce live typing; also re-run on filter changes.
  useEffect(() => {
    const q = query.trim();
    const empty = filtersAreEmpty(filters);
    if (!q && empty) {
      setHits([]);
      setLastQuery('');
      return;
    }
    const t = setTimeout(() => {
      runSearch(query, filters);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, filters, runSearch]);

  const handleSubmit = useCallback(() => {
    const trimmed = query.trim();
    runSearch(trimmed, filters);
    if (trimmed) push(trimmed);
  }, [filters, push, query, runSearch]);

  const handleRecentPress = useCallback(
    (text: string) => {
      setQuery(text);
      runSearch(text, filters);
      push(text);
    },
    [filters, push, runSearch],
  );

  const handleApplyFilters = useCallback((next: SearchFilters) => {
    setFilters(next);
    setFiltersOpen(false);
  }, []);

  const removeFilter = useCallback((key: keyof SearchFilters) => {
    setFilters((f) => {
      if (key === 'dateFrom' || key === 'dateTo') {
        return { ...f, dateFrom: null, dateTo: null };
      }
      return { ...f, [key]: null };
    });
  }, []);

  const filterCount = activeFilterCount(filters);
  const hasQuery = query.trim().length > 0;
  const hasAnyInput = hasQuery || !filtersAreEmpty(filters);

  return (
    <View style={styles.container}>
      <AppBar title="Search" />

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Icon name="search" size={16} color={colors.mute} weight={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            placeholder="Describe the fault, machine, or error"
            placeholderTextColor={colors.mute}
            style={styles.input}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Icon name="x" size={16} color={colors.mute} weight={2} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => setFiltersOpen(true)}
          style={({ pressed }) => [
            styles.filterBtn,
            filterCount > 0 && styles.filterBtnActive,
            pressed && styles.pressed,
          ]}
        >
          <Icon
            name="filter"
            size={16}
            color={filterCount > 0 ? '#fff' : colors.navy}
            weight={2}
          />
          {filterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{filterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {filterCount > 0 && (
        <View style={styles.activePillsRow}>
          {filters.dept && (
            <ActivePill label={`Dept: ${filters.dept}`} onRemove={() => removeFilter('dept')} styles={styles} colors={colors} />
          )}
          {filters.machine && (
            <ActivePill label={`Machine: ${filters.machine}`} onRemove={() => removeFilter('machine')} styles={styles} colors={colors} />
          )}
          {filters.status && (
            <ActivePill
              label={`Status: ${STATUS_OPTIONS.find((o) => o.id === filters.status)?.label ?? filters.status}`}
              onRemove={() => removeFilter('status')}
              styles={styles}
              colors={colors}
            />
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <ActivePill
              label={`${filters.dateFrom ?? '…'} → ${filters.dateTo ?? '…'}`}
              onRemove={() => removeFilter('dateFrom')}
              styles={styles}
              colors={colors}
            />
          )}
        </View>
      )}

      {error && (
        <View style={styles.errorCard}>
          <Icon name="warning" size={14} color={colors.red} weight={2} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!hasAnyInput ? (
        <EmptyState recents={recents} onTap={handleRecentPress} onClear={clear} styles={styles} />
      ) : (
        <FlatList
          data={hits}
          keyExtractor={(h) => String(h.job.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.results,
            { paddingBottom: insets.bottom + 120 },
          ]}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              {loading ? (
                <View style={styles.resultsMetaRow}>
                  <ActivityIndicator size="small" color={colors.navy} />
                  <Text style={styles.resultsMeta}>Searching…</Text>
                </View>
              ) : lastQuery ? (
                <Text style={styles.resultsMeta}>
                  {hits.length} {hits.length === 1 ? 'match' : 'matches'} for “{lastQuery}”
                </Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            !loading && lastQuery ? (
              <View style={styles.empty}>
                <Icon name="search" size={36} color={colors.mute} weight={1.5} />
                <Text style={styles.emptyTitle}>No similar past jobs.</Text>
                <Text style={styles.emptyHint}>
                  This might be a new kind of fault — document it well.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.hitWrap}>
              <JobCard
                job={item.job}
                variant="horizontal"
                onPress={() => onOpenJob(item.job.id)}
                testID={`search-hit-${item.job.id}`}
              />
              {item.snippet && (
                <View style={styles.snippetCard}>
                  <Text style={styles.snippetField}>{item.matchedField}</Text>
                  <HighlightedText text={item.snippet} query={lastQuery} styles={styles} />
                </View>
              )}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}

      <SearchFiltersModal
        visible={filtersOpen}
        initial={filters}
        onApply={handleApplyFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </View>
  );
}

function ActivePill({
  label,
  onRemove,
  styles,
  colors,
}: {
  label: string;
  onRemove(): void;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onRemove}
      style={({ pressed }) => [styles.activePill, pressed && styles.pressed]}
    >
      <Text style={styles.activePillText}>{label}</Text>
      <Icon name="x" size={12} color={colors.navy} weight={2.5} />
    </Pressable>
  );
}

function EmptyState({
  recents,
  onTap,
  onClear,
  styles,
}: {
  recents: string[];
  onTap(q: string): void;
  onClear(): void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const colors = useColors();
  if (recents.length === 0) {
    return (
      <View style={styles.emptyWelcome}>
        <Icon name="search" size={40} color={colors.mute} weight={1.5} />
        <Text style={styles.emptyTitle}>Find past jobs.</Text>
        <Text style={styles.emptyHint}>
          Search across machine names, transcripts, root causes, photo
          descriptions, and more.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.recentsWrap}>
      <SectionLabel right={<ClearRecents onPress={onClear} styles={styles} />}>Recent searches</SectionLabel>
      <View style={styles.recentsList}>
        {recents.map((r) => (
          <Pressable
            key={r}
            onPress={() => onTap(r)}
            style={({ pressed }) => [styles.recentPill, pressed && styles.pressed]}
          >
            <Icon name="clock" size={12} color={colors.muteDeep} weight={2} />
            <Text style={styles.recentText}>{r}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ClearRecents({ onPress, styles }: { onPress(): void; styles: ReturnType<typeof makeStyles> }) {
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Text style={styles.clearLink}>Clear</Text>
    </Pressable>
  );
}

function HighlightedText({ text, query, styles }: { text: string; query: string; styles: ReturnType<typeof makeStyles> }) {
  const q = query.trim();
  if (!q) return <Text style={styles.snippetText}>{text}</Text>;
  const parts: Array<{ text: string; match: boolean }> = [];
  const lower = text.toLowerCase();
  const qlow = q.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(qlow, i);
    if (idx === -1) {
      parts.push({ text: text.slice(i), match: false });
      break;
    }
    if (idx > i) parts.push({ text: text.slice(i, idx), match: false });
    parts.push({ text: text.slice(idx, idx + q.length), match: true });
    i = idx + q.length;
  }
  return (
    <Text style={styles.snippetText}>
      {parts.map((p, idx) =>
        p.match ? (
          <Text key={idx} style={styles.snippetMatch}>
            {p.text}
          </Text>
        ) : (
          <Text key={idx}>{p.text}</Text>
        ),
      )}
    </Text>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  filterBtn: {
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.ink,
  },
  activePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.navy,
    backgroundColor: '#fff',
  },
  activePillText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11.5,
    color: colors.navy,
    letterSpacing: 0.2,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.red,
    backgroundColor: colors.redSoft,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.red,
  },
  results: {
    paddingHorizontal: spacing.xl,
  },
  resultsHeader: { paddingBottom: spacing.sm },
  resultsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultsMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.mute,
  },
  hitWrap: { gap: 6 },
  snippetCard: {
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    gap: 3,
  },
  snippetField: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muteDeep,
  },
  snippetText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textDim,
  },
  snippetMatch: {
    backgroundColor: colors.yellow,
    color: colors.text,
    fontFamily: fonts.sansSemiBold,
  },
  sep: { height: spacing.sm },
  empty: {
    alignItems: 'center',
    padding: spacing.xxl,
    gap: 6,
  },
  emptyWelcome: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.text,
    marginTop: 4,
  },
  emptyHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.mute,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  recentsWrap: {
    paddingHorizontal: spacing.xl,
  },
  recentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 4,
  },
  recentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.85 },
  recentText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text,
  },
  clearLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.mute,
    letterSpacing: 0.3,
  },
});
