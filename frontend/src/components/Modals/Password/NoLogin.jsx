import React, { useEffect, useState } from "react";
import System from "../../../models/system";
import { AUTH_TOKEN, AUTH_USER } from "../../../utils/constants";
import paths from "../../../utils/paths";
import showToast from "@/utils/toast";
import ModalWrapper from "@/components/ModalWrapper";
import { useModal } from "@/hooks/useModal";
import RecoveryCodeModal from "@/components/Modals/DisplayRecoveryCodeModal";
import Workspace from "@/models/workspace";

export default function NoLoginUserAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [customAppName, setCustomAppName] = useState(null);

  const {
    isOpen: isRecoveryCodeModalOpen,
    openModal: openRecoveryCodeModal,
    closeModal: closeRecoveryCodeModal,
  } = useModal();

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    const data = {
      username: 'primihub',
      password: 'primihub'
    };

    const { valid, user, token, message, recoveryCodes } =
      await System.requestToken(data);

    if (valid && !!token && !!user) {
      setUser(user);
      setToken(token);
      if (recoveryCodes) {
        setRecoveryCodes(recoveryCodes);
        openRecoveryCodeModal();
      } else {
        window.localStorage.setItem(AUTH_USER, JSON.stringify(user));
        window.localStorage.setItem(AUTH_TOKEN, token);
        await newThread();
      }
    } else {
      setError(message);
      setLoading(false);
    }
    setLoading(false);
  };

  const newThread = async () => {
    const { thread, error } = await Workspace.threads.new('primihub');
      if (!!error) {
        showToast(`Could not create thread - ${error}`, "error", { clear: true });
        return;
      }
      window.location.replace(
        paths.workspace.thread('primihub', thread.slug)
      );
  };

  const handleDownloadComplete = () => setDownloadComplete(true);
  const handleRecoverySubmit = async (username, recoveryCodes) => {
    const { success, resetToken, error } = await System.recoverAccount(
      username,
      recoveryCodes
    );

    if (success && resetToken) {
      window.localStorage.setItem("resetToken", resetToken);
      setShowRecoveryForm(false);
      setShowResetPasswordForm(true);
    } else {
      showToast(error, "error", { clear: true });
    }
  };

// 登陆
useEffect(() => {
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('nt') === '1') {
    handleLogin()
  }
}, [])


useEffect(() => {
  if (downloadComplete && user && token) {
    window.localStorage.setItem(AUTH_USER, JSON.stringify(user));
    window.localStorage.setItem(AUTH_TOKEN, token);
    window.location = paths.home();
  }
}, [downloadComplete, user, token]);

useEffect(() => {
  const fetchCustomAppName = async () => {
    const { appName } = await System.fetchCustomAppName();
    setCustomAppName(appName || "");
    setLoading(false);
  };
  fetchCustomAppName();
}, []);

if (showRecoveryForm) {
  return (
    <RecoveryForm
      onSubmit={handleRecoverySubmit}
      setShowRecoveryForm={setShowRecoveryForm}
    />
  );
}

return (
  <>
    <form onSubmit={handleLogin}>
      <div className="flex flex-col justify-center items-center relative rounded-2xl md:bg-login-gradient md:shadow-[0_4px_14px_rgba(0,0,0,0.25)] md:px-12 py-12 -mt-4 md:mt-0">
        <div className="flex items-start justify-between pt-11 pb-9 rounded-t">
          <div className="flex items-center flex-col gap-y-4">
            <div className="flex gap-x-1">
              <h3 className="text-md md:text-2xl font-bold text-white text-center white-space-nowrap hidden md:block">
                Welcome to
              </h3>
              <p className="text-4xl md:text-2xl font-bold bg-gradient-to-r from-[#75D6FF] via-[#FFFFFF] to-[#FFFFFF] bg-clip-text text-transparent">
                {customAppName || "AnythingLLM"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>

    <ModalWrapper isOpen={isRecoveryCodeModalOpen}>
      <RecoveryCodeModal
        recoveryCodes={recoveryCodes}
        onDownloadComplete={handleDownloadComplete}
        onClose={closeRecoveryCodeModal}
      />
    </ModalWrapper>
  </>
);
}
