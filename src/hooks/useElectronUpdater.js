import { useEffect, useState } from "react";

export function useElectronUpdater() {
  const [update, setUpdate] = useState({
    status: "idle",
    version: null,
    percent: 0,
    error: null,
  });

  useEffect(() => {
    if (!window.electronAPI?.updater) {
      return undefined;
    }

    const updater = window.electronAPI.updater;

    updater.onChecking((data) => {
      setUpdate((current) => ({
        ...current,
        ...data,
        status: "checking",
      }));
    });

    updater.onAvailable((data) => {
      setUpdate((current) => ({
        ...current,
        ...data,
        status: "available",
      }));

      // Descarga automática.
      updater.download();
    });

    updater.onNotAvailable((data) => {
      setUpdate((current) => ({
        ...current,
        ...data,
        status: "not-available",
      }));
    });

    updater.onProgress((data) => {
      setUpdate((current) => ({
        ...current,
        ...data,
        status: "downloading",
      }));
    });

    updater.onDownloaded(async (data) => {
        setUpdate((current) => ({
            ...current,
            ...data,
            status: "downloaded",
            percent: 100,
        }));

        setTimeout(() => {
            updater.install();
        }, 1500);
    });

    updater.onError((data) => {
      setUpdate((current) => ({
        ...current,
        ...data,
        status: "error",
      }));
    });

    return undefined;
  }, []);

  return update;
}