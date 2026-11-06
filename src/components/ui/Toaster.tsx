import { Toaster as Sonner } from "sonner";
import styles from "./Toaster.module.css";

/**
 * The one toast stack, mounted once in AppShell. Sonner keeps positioning,
 * stacking and swipe; the look is ours (a small frosted panel), so its own
 * styles are off and the theme comes from our tokens, not its `theme` prop.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: styles.toast,
          content: styles.content,
          title: styles.title,
          description: styles.description,
          icon: styles.icon,
          actionButton: styles.action,
          cancelButton: styles.action,
          success: styles.success,
          error: styles.error,
        },
      }}
    />
  );
}
