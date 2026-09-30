import toast, { Toast } from 'react-hot-toast';

const toastConfig = {
  duration: 4000,
  position: 'top-right' as const,
  style: {
    borderRadius: '12px',
    fontSize: '14px',
    padding: '16px 20px',
    maxWidth: '400px',
  },
};

// Generate initials from firstname + lastname
function getInitials(firstname: string, lastname: string): string {
  const f = firstname?.[0] || '';
  const l = lastname?.[0] || '';
  return `${f}${l}`.toUpperCase() || '?';
}

// Generate consistent color from userId
function getUserColor(userId: number): string {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
  return colors[userId % colors.length];
}

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      ...toastConfig,
      icon: '✓',
      style: {
        ...toastConfig.style,
        background: '#10b981',
        color: '#ffffff',
      },
    });
  },

  error: (message: string) => {
    toast.error(message, {
      ...toastConfig,
      icon: '✕',
      style: {
        ...toastConfig.style,
        background: '#ef4444',
        color: '#ffffff',
      },
    });
  },

  warning: (message: string) => {
    toast(message, {
      ...toastConfig,
      icon: '⚠',
      style: {
        ...toastConfig.style,
        background: '#f59e0b',
        color: '#ffffff',
      },
    });
  },

  info: (message: string) => {
    toast(message, {
      ...toastConfig,
      icon: 'ℹ',
      style: {
        ...toastConfig.style,
        background: '#3b82f6',
        color: '#ffffff',
      },
    });
  },

  userJoined: (firstname: string, lastname: string, userId: number) => {
    const initials = getInitials(firstname, lastname);
    const color = getUserColor(userId);
    const fullName = `${firstname} ${lastname}`.trim() || 'Utilisateur';

    toast.custom(
      (t: Toast) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#fff',
            borderRadius: '14px',
            padding: '12px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            border: '1px solid #f0f0f0',
            maxWidth: '320px',
            opacity: t.visible ? 1 : 0,
            transform: t.visible ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.95)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
              boxShadow: `0 0 0 3px ${color}33`,
            }}
          >
            {initials}
          </div>

          {/* Text */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', lineHeight: 1.3 }}>
              {fullName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#6B7280' }}>a rejoint la session</span>
            </div>
          </div>
        </div>
      ),
      { duration: 4000, position: 'bottom-right' }
    );
  },

  userLeft: (firstname: string, lastname: string, userId: number) => {
    const initials = getInitials(firstname, lastname);
    const color = getUserColor(userId);
    const fullName = `${firstname} ${lastname}`.trim() || 'Utilisateur';

    toast.custom(
      (t: Toast) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#fff',
            borderRadius: '14px',
            padding: '12px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            border: '1px solid #f0f0f0',
            maxWidth: '320px',
            opacity: t.visible ? 1 : 0,
            transform: t.visible ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.95)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Avatar with grayscale */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#9CA3AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          {/* Text */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', lineHeight: 1.3 }}>
              {fullName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9CA3AF', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#6B7280' }}>a quitté la session</span>
            </div>
          </div>
        </div>
      ),
      { duration: 3000, position: 'bottom-right' }
    );
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }
  ) => {
    return toast.promise(
      promise,
      {
        loading,
        success,
        error,
      },
      {
        ...toastConfig,
        style: {
          ...toastConfig.style,
        },
      }
    );
  },
};
