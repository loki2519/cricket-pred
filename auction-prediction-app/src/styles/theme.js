export const colors = {
  primary: '#0D1B2A',        // Deep Navy
  secondary: '#1D4ED8',      // Modern Blue
  accent: '#E6B800',         // Gold
  background: '#F4F7FB',
  card: '#FFFFFF',
  section: '#EEF2F7',
  border: '#E2E8F0',
  text: '#0D1B2A',           // Text Primary
  textSecondary: '#1E293B',
  textLight: '#64748B',      // Text Muted
  white: '#FFFFFF',
  success: '#16A34A',
  warning: '#F97316',
  error: '#DC2626',
  priceHighlight: '#E6B800',
  budget: '#1D4ED8',
  cricketGreen: '#2E7D32',
  pitchBrown: '#8B5E3C',
  blue: '#1D4ED8',           // Legacy fallback to Secondary
};

export const globalStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,        // softer rounded corners
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: colors.primary, // softer shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.white,
    marginBottom: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonSecondary: {
    backgroundColor: colors.border,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonAuction: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextAuction: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    margin: 16,
  }
};
