import React, { createContext, useCallback, useContext, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";

type Notice = {
  title: string;
  message?: string;
};

const NoticeContext = createContext<
  ((title: string, message?: string) => void) | null
>(null);

/**
 * Owns the one dialog used to tell the user something. It lives at the root so
 * that any screen can show a message without keeping dialog state of its own.
 */
export function NoticeProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const notify = useCallback(
    (title: string, message?: string) => setNotice({ message, title }),
    []
  );
  const dismiss = () => setNotice(null);

  return (
    <NoticeContext.Provider value={notify}>
      {children}

      <ConfirmDialog
        actions={[{ label: "OK", onPress: dismiss }]}
        message={notice?.message}
        onDismiss={dismiss}
        title={notice?.title ?? ""}
        visible={notice !== null}
      />
    </NoticeContext.Provider>
  );
}

/** Shows a message in the app's own dialog. Replaces `Alert.alert`. */
export function useNotice(): (title: string, message?: string) => void {
  const notify = useContext(NoticeContext);
  if (!notify) {
    throw new Error("useNotice must be used inside a NoticeProvider");
  }
  return notify;
}
