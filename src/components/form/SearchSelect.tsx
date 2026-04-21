import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../design/components/Icon';
import { fonts, radii, spacing, type ThemeColors, useColors } from '../../design/tokens';

export interface SelectOption {
  id: number | string;
  label: string;
  sublabel?: string;
}

interface SearchSelectProps {
  label: string;
  value: SelectOption | null;
  options: SelectOption[];
  onChange(next: SelectOption | null): void;
  required?: boolean;
  disabled?: boolean;
  disabledHint?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  error?: string | null;
}

export function SearchSelect({
  label,
  value,
  options,
  onChange,
  required,
  disabled,
  disabledHint,
  placeholder = 'Select…',
  searchPlaceholder = 'Search',
  emptyMessage = 'No matches',
  error,
}: SearchSelectProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  const handleOpen = () => {
    if (disabled) return;
    setQuery('');
    setOpen(true);
  };

  const handlePick = (opt: SelectOption) => {
    onChange(opt);
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <Pressable
        onPress={handleOpen}
        disabled={disabled}
        style={({ pressed }) => [
          styles.field,
          disabled && styles.fieldDisabled,
          !!error && styles.fieldError,
          pressed && !disabled && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.fieldText,
            !value && styles.fieldPlaceholder,
            disabled && styles.fieldTextDisabled,
          ]}
          numberOfLines={1}
        >
          {value?.label ?? (disabled && disabledHint ? disabledHint : placeholder)}
        </Text>
        <Icon
          name="search"
          size={16}
          color={disabled ? colors.mute : colors.muteDeep}
          weight={2}
        />
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={() => setOpen(false)}
      >
        <View style={[styles.modal, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Icon name="x" size={22} color={colors.text} weight={2} />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <Icon name="search" size={16} color={colors.mute} weight={2} />
            <TextInput
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.mute}
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Icon name="x" size={14} color={colors.mute} weight={2} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{emptyMessage}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handlePick(item)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  {item.sublabel && <Text style={styles.rowSublabel}>{item.sublabel}</Text>}
                </View>
                {value?.id === item.id && (
                  <Icon name="check" size={16} color={colors.emerald} weight={2.5} />
                )}
              </Pressable>
            )}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          />
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.muteDeep,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  required: { color: colors.red },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  fieldDisabled: {
    backgroundColor: colors.lineSoft,
    borderColor: colors.lineSoft,
  },
  fieldError: { borderColor: colors.red },
  pressed: { opacity: 0.9 },
  fieldText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
  },
  fieldPlaceholder: { color: colors.mute },
  fieldTextDisabled: { color: colors.mute },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.red,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
    color: colors.text,
    letterSpacing: -0.3,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  rowPressed: { backgroundColor: colors.lineSoft },
  rowText: { flex: 1 },
  rowLabel: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
  },
  rowSublabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.mute,
    marginTop: 2,
  },
  empty: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.mute,
  },
});
