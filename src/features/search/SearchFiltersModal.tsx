import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchSelect, type SelectOption } from '../../components/form';
import { Btn, Icon } from '../../design/components';
import { fonts, radii, spacing, type ThemeColors, useColors } from '../../design/tokens';
import type { JobStatus } from '../../types/job';
import { localDateIso } from '../../utils/localDate';
import { useCatalog } from '../catalog/useCatalog';
import { STATUS_OPTIONS } from '../jobs/statusOptions';
import { EMPTY_FILTERS, type SearchFilters } from './searchApi';

interface SearchFiltersModalProps {
  visible: boolean;
  initial: SearchFilters;
  onApply(filters: SearchFilters): void;
  onClose(): void;
}

function parseIso(iso: string | null): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatDisplay(iso: string | null): string {
  if (!iso) return 'Any';
  const d = parseIso(iso);
  if (!d) return 'Any';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export function SearchFiltersModal({
  visible,
  initial,
  onApply,
  onClose,
}: SearchFiltersModalProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const catalog = useCatalog();
  const [filters, setFilters] = useState<SearchFilters>(initial);
  const [datePicker, setDatePicker] = useState<'from' | 'to' | null>(null);

  // Reset local state each time the modal opens.
  useMemo(() => {
    if (visible) setFilters(initial);
  }, [visible, initial]);

  const deptOption: SelectOption | null = useMemo(
    () =>
      filters.dept
        ? { id: filters.dept, label: filters.dept }
        : null,
    [filters.dept],
  );

  const deptOptions: SelectOption[] = useMemo(
    () => catalog.departments.map((d) => ({ id: d.name, label: d.name })),
    [catalog.departments],
  );

  const machineOptions: SelectOption[] = useMemo(() => {
    // If dept is selected, restrict to that dept's machines. Otherwise show all.
    const filtered = filters.dept
      ? catalog.machines.filter((m) => {
          const dept = catalog.departments.find((d) => d.id === m.department_id);
          return dept?.name === filters.dept;
        })
      : catalog.machines;
    return filtered.map((m) => ({ id: m.name, label: m.name }));
  }, [catalog.departments, catalog.machines, filters.dept]);

  const machineOption: SelectOption | null = filters.machine
    ? { id: filters.machine, label: filters.machine }
    : null;

  const statusOption: SelectOption | null = filters.status
    ? STATUS_OPTIONS.find((s) => s.id === filters.status) ?? null
    : null;

  const handleDateChange = (which: 'from' | 'to') => (_: DateTimePickerEvent, next?: Date) => {
    if (Platform.OS === 'android') setDatePicker(null);
    if (!next) return;
    setFilters((f) => ({
      ...f,
      [which === 'from' ? 'dateFrom' : 'dateTo']: localDateIso(next),
    }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Icon name="x" size={22} color={colors.text} weight={2} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <SearchSelect
            label="Department"
            value={deptOption}
            options={deptOptions}
            onChange={(next) =>
              setFilters((f) => ({
                ...f,
                dept: next ? String(next.id) : null,
                // Clearing / changing dept wipes the machine choice so it can't
                // be orphaned.
                machine: null,
              }))
            }
            placeholder="Any department"
            searchPlaceholder="Search departments"
          />

          <SearchSelect
            label="Machine"
            value={machineOption}
            options={machineOptions}
            onChange={(next) =>
              setFilters((f) => ({ ...f, machine: next ? String(next.id) : null }))
            }
            placeholder={filters.dept ? 'Any machine in dept' : 'Any machine'}
            searchPlaceholder="Search machines"
          />

          <SearchSelect
            label="Status"
            value={statusOption}
            options={STATUS_OPTIONS}
            onChange={(next) =>
              setFilters((f) => ({ ...f, status: next ? (String(next.id) as JobStatus) : null }))
            }
            placeholder="Any status"
            searchPlaceholder="Search status"
          />

          <View style={styles.group}>
            <Text style={styles.groupLabel}>Date range</Text>
            <View style={styles.dateRow}>
              <Pressable
                onPress={() => setDatePicker('from')}
                style={({ pressed }) => [styles.dateCell, pressed && styles.pressed]}
              >
                <Text style={styles.dateCellLabel}>From</Text>
                <Text
                  style={[styles.dateCellValue, !filters.dateFrom && styles.dateCellPlaceholder]}
                >
                  {formatDisplay(filters.dateFrom)}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setDatePicker('to')}
                style={({ pressed }) => [styles.dateCell, pressed && styles.pressed]}
              >
                <Text style={styles.dateCellLabel}>To</Text>
                <Text
                  style={[styles.dateCellValue, !filters.dateTo && styles.dateCellPlaceholder]}
                >
                  {formatDisplay(filters.dateTo)}
                </Text>
              </Pressable>
            </View>
            {(filters.dateFrom || filters.dateTo) && (
              <Pressable
                onPress={() => setFilters((f) => ({ ...f, dateFrom: null, dateTo: null }))}
                hitSlop={6}
              >
                <Text style={styles.clearDates}>Clear dates</Text>
              </Pressable>
            )}
          </View>

          {datePicker && (
            <DateTimePicker
              value={parseIso(datePicker === 'from' ? filters.dateFrom : filters.dateTo) ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              maximumDate={datePicker === 'from' && filters.dateTo ? parseIso(filters.dateTo) ?? undefined : undefined}
              minimumDate={datePicker === 'to' && filters.dateFrom ? parseIso(filters.dateFrom) ?? undefined : undefined}
              onChange={handleDateChange(datePicker)}
            />
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable
            onPress={() => setFilters(EMPTY_FILTERS)}
            style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
          >
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Btn kind="primary" size="lg" block onPress={() => onApply(filters)}>
              Apply filters
            </Btn>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colors.text,
    letterSpacing: -0.3,
  },
  body: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  group: { gap: 6 },
  groupLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.muteDeep,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: 2,
  },
  pressed: { opacity: 0.85 },
  dateCellLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: colors.muteDeep,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dateCellValue: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
  },
  dateCellPlaceholder: { color: colors.mute },
  clearDates: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.mute,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  resetBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  resetText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.text,
    letterSpacing: 0.3,
  },
});
