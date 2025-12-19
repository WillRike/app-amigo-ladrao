import React, { useEffect, useRef, useState } from "react";
import bannerImage from "./assets/amigo-ladrao.png";

const STORAGE_KEYS = {
  names: "secretFriend:names",
  drawnNames: "secretFriend:drawnNames",
  currentDraw: "secretFriend:currentDraw",
  soundEnabled: "secretFriend:soundEnabled",
  soundVolume: "secretFriend:soundVolume",
};

const loadStoredArray = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erro ao carregar dados armazenados", error);
    return [];
  }
};

const loadStoredString = (key) => {
  try {
    return localStorage.getItem(key) || "";
  } catch (error) {
    console.error("Erro ao carregar dados armazenados", error);
    return "";
  }
};

const Modal = ({ isOpen, title, onClose, children, footer, widthClass }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal ${widthClass || ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button
            type="button"
            className="close-button"
            aria-label="Fechar modal"
            onClick={onClose}
          >
            X
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

const GameModal = ({
  isOpen,
  onClose,
  onDraw,
  isDrawing,
  displayedName,
  rollingName,
  drawnNames,
  namesLeft,
}) => {
  if (!isOpen) return null;

  const currentText =
    displayedName ||
    (isDrawing ? rollingName : "Nenhum sorteado ainda. Clique em 'Sortear proximo'.");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal game-modal"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="modal-header">
          <h3>Jogo</h3>
          <button
            type="button"
            className="close-button"
            aria-label="Fechar jogo"
            onClick={onClose}
          >
            X
          </button>
        </div>
        <div className="modal-body game-body">
          <div className="game-current">
            <p className="game-current-label">Sorteado atual</p>
            <div
              className={`game-current-card ${
                isDrawing ? "rolling" : displayedName ? "winner" : ""
              }`}
            >
              {currentText}
            </div>
          </div>

          <div className="game-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={onDraw}
              disabled={namesLeft === 0 || isDrawing}
            >
              Sortear proximo
            </button>
            {namesLeft === 0 && (
              <p className="hint">Nenhum participante restante para sortear.</p>
            )}
          </div>

          <div className="game-drawn-list">
            <h4>Ja sorteados</h4>
            {drawnNames.length === 0 ? (
              <p className="hint">Ninguem sorteado ainda.</p>
            ) : (
              <ul>
                {drawnNames.map((name, index) => (
                  <li key={`${name}-${index}`}>{name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SecretFriend = () => {
  const [names, setNames] = useState(() => loadStoredArray(STORAGE_KEYS.names));
  const [input, setInput] = useState("");
  const [drawnNames, setDrawnNames] = useState(() =>
    loadStoredArray(STORAGE_KEYS.drawnNames)
  );
  const [currentDraw, setCurrentDraw] = useState(() =>
    loadStoredString(STORAGE_KEYS.currentDraw)
  );
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.soundEnabled);
      return stored === null ? true : stored === "true";
    } catch (error) {
      console.error("Erro ao carregar som habilitado", error);
      return true;
    }
  });
  const [soundVolume, setSoundVolume] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.soundVolume);
      return stored ? Number(stored) : 0.3;
    } catch (error) {
      console.error("Erro ao carregar volume", error);
      return 0.3;
    }
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [rollingName, setRollingName] = useState("");
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [confirmModal, setConfirmModal] = useState({ type: null });
  const audioContextRef = useRef(null);
  const rollIntervalRef = useRef(null);
  const rollTimeoutRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.names, JSON.stringify(names));
  }, [names]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.drawnNames, JSON.stringify(drawnNames));
  }, [drawnNames]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.currentDraw, currentDraw);
  }, [currentDraw]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.soundEnabled, String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.soundVolume, String(soundVolume));
  }, [soundVolume]);

  useEffect(() => {
    if (!isSoundSettingsOpen) return undefined;

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setIsSoundSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isSoundSettingsOpen]);

  useEffect(() => {
    if (!isGameModalOpen) return undefined;

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setIsGameModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isGameModalOpen]);

  useEffect(() => {
    if (!feedbackMessage) return undefined;
    const timer = setTimeout(() => setFeedbackMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [feedbackMessage]);

  const normalizeName = (name) => name.trim().toLowerCase();
  const hasDrawn = drawnNames.length > 0 || Boolean(currentDraw);
  const actionsLocked = hasDrawn || isDrawing;

  const clearRollingTimers = () => {
    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
    }
    if (rollTimeoutRef.current) {
      clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = null;
    }
  };

  const getAudioContext = () => {
    if (audioContextRef.current) return audioContextRef.current;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioContextRef.current = new AudioCtx();
    return audioContextRef.current;
  };

  const playTickSound = () => {
    if (!soundEnabled || soundVolume === 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 950;
    gain.gain.value = 0.04 * soundVolume;
    osc.connect(gain).connect(ctx.destination);

    const now = ctx.currentTime;
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.stop(now + 0.05);
  };

  const playRevealSound = () => {
    if (!soundEnabled || soundVolume === 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
    gain.gain.value = 0.08 * soundVolume;
    osc.connect(gain).connect(ctx.destination);

    const now = ctx.currentTime;
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.stop(now + 0.35);
  };

  const addName = () => {
    if (actionsLocked) return;

    const normalizedInput = normalizeName(input);
    if (!normalizedInput) {
      setFeedbackMessage("Digite um nome valido.");
      return;
    }

    const isDuplicate = names.some(
      (name) => normalizeName(name) === normalizedInput
    );

    if (isDuplicate) {
      setFeedbackMessage("Este nome ja foi adicionado.");
      return;
    }

    setNames([...names, input.trim()]);
    setInput("");
    setFeedbackMessage("");
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addName();
    }
  };

  const removeName = (index) => {
    if (actionsLocked) return;
    setNames(names.filter((_, idx) => idx !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingValue("");
    }
  };

  const startEditing = (index) => {
    if (actionsLocked) return;
    setEditingIndex(index);
    setEditingValue(names[index]);
  };

  const confirmEdit = (index) => {
    if (editingIndex !== index) return;

    const trimmed = editingValue.trim();
    if (!trimmed) {
      setFeedbackMessage("Nome nao pode ser vazio.");
      return;
    }

    const normalizedNew = normalizeName(trimmed);
    const isDuplicate = names.some(
      (name, idx) => idx !== index && normalizeName(name) === normalizedNew
    );

    if (isDuplicate) {
      setFeedbackMessage("Este nome ja foi adicionado.");
      return;
    }

    const updatedNames = [...names];
    updatedNames[index] = trimmed;
    setNames(updatedNames);
    setEditingIndex(null);
    setEditingValue("");
    setFeedbackMessage("");
  };

  const handleEditKeyDown = (event, index) => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmEdit(index);
    }
  };

  const drawName = () => {
    if (isDrawing || names.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * names.length);
    const drawnName = names[randomIndex];

    setIsDrawing(true);
    setRollingName(names[0]);

    const tickInterval = 100;
    const rollDuration = 2000;

    rollIntervalRef.current = setInterval(() => {
      setRollingName(
        names[Math.floor(Math.random() * Math.max(names.length, 1))]
      );
      playTickSound();
    }, tickInterval);

    rollTimeoutRef.current = setTimeout(() => {
      clearRollingTimers();

      setDrawnNames([...drawnNames, drawnName]);
      setNames(names.filter((_, index) => index !== randomIndex));
      setCurrentDraw(drawnName);
      setRollingName("");
      setEditingIndex(null);
      setEditingValue("");
      setIsDrawing(false);
      playRevealSound();
    }, rollDuration);
  };

  const startNewSession = () => {
    if (isDrawing) return;

    localStorage.clear();
    setNames([]);
    setDrawnNames([]);
    setCurrentDraw("");
    setInput("");
    setEditingIndex(null);
    setEditingValue("");
    setSoundEnabled(true);
    setSoundVolume(0.3);
    setIsSoundSettingsOpen(false);
    setIsGameModalOpen(false);
    setFeedbackMessage("");
    setConfirmModal({ type: null });
  };

  const restartDrawKeepingParticipants = () => {
    if (!hasDrawn || isDrawing) return;

    setNames([...names, ...drawnNames]);
    setDrawnNames([]);
    setCurrentDraw("");
    setEditingIndex(null);
    setEditingValue("");
    setFeedbackMessage("");
    setConfirmModal({ type: null });
  };

  useEffect(() => {
    return () => {
      clearRollingTimers();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const displayedName = isDrawing ? rollingName : currentDraw;
  const closeSoundSettings = () => setIsSoundSettingsOpen(false);
  const openConfirmModal = (type) => setConfirmModal({ type });
  const closeConfirmModal = () => setConfirmModal({ type: null });

  const confirmModalContent = () => {
    if (confirmModal.type === "newSession") {
      return {
        title: "Iniciar nova sessao",
        message:
          "Tem certeza que deseja iniciar uma nova sessao? Todos os participantes e resultados serao apagados.",
        action: startNewSession,
        primaryVariant: "danger",
      };
    }
    if (confirmModal.type === "restartDraw") {
      return {
        title: "Reiniciar sorteio",
        message:
          "Deseja reiniciar o sorteio? Os participantes serao mantidos, mas os resultados serao apagados.",
        action: restartDrawKeepingParticipants,
        primaryVariant: "primary",
      };
    }
    return null;
  };

  const confirmData = confirmModalContent();

  return (
    <div className="app-container">
      <header className="app-banner">
        <div className="app-banner__left">
          <img
            src={bannerImage}
            alt="Ilustracao Amigo Ladrao"
            className="app-banner__image"
          />
          <div className="app-banner__title">Amigo Ladrao</div>
        </div>
        <div className="app-banner__right">
          <button
            type="button"
            className="settings-button settings-button--banner"
            aria-label="Configuracoes de som"
            onClick={() => setIsSoundSettingsOpen(true)}
          >
            {"\u2699"}
          </button>
        </div>
      </header>
      <header className="app-header">
        <p>Adicione os nomes e clique para sortear um por vez!</p>
      </header>

      <div className="layout-grid">
        <section className="card participants-card">
          <div className="card-header">
            <h3>Participantes</h3>
            <p className="muted">
              Adicione nomes e gerencie antes de iniciar o jogo.
            </p>
          </div>
          <div className="input-row">
            <input
              type="text"
              placeholder="Digite um nome"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={actionsLocked}
            />
            <button
              className="btn btn-primary"
              onClick={addName}
              disabled={!input.trim() || actionsLocked}
            >
              Adicionar
            </button>
          </div>
          {feedbackMessage && <p className="feedback">{feedbackMessage}</p>}
          <ul className="list">
            {names.map((name, index) => (
              <li className="list-item" key={index}>
                {editingIndex === index ? (
                  <input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={() => confirmEdit(index)}
                    onKeyDown={(event) => handleEditKeyDown(event, index)}
                    autoFocus
                  />
                ) : (
                  <span>{name}</span>
                )}

                {!actionsLocked && editingIndex !== index && (
                  <div className="icon-actions">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => startEditing(index)}
                      aria-label="Editar participante"
                      title="Editar participante"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="icon-button danger"
                      onClick={() => removeName(index)}
                      aria-label="Remover participante"
                      title="Remover participante"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="card game-card">
          <div className="card-header">
            <h3>Jogo</h3>
            <p className="muted">
              {drawnNames.length} sorteados de {names.length + drawnNames.length}
              . Restantes: {names.length}
            </p>
          </div>
          <div className="game-cta">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setIsGameModalOpen(true)}
              disabled={isDrawing}
            >
              {hasDrawn ? "Continuar jogo" : "Iniciar jogo"}
            </button>
          </div>
          <div className="game-actions-inline">
            <button
              className="btn btn-secondary"
              onClick={() => openConfirmModal("restartDraw")}
              disabled={!hasDrawn || isDrawing}
            >
              Reiniciar sorteio (manter participantes)
            </button>
            <button
              className="btn btn-danger"
              onClick={() => openConfirmModal("newSession")}
              disabled={isDrawing}
            >
              Nova sessao
            </button>
          </div>
        </section>

        <section className="card drawn-card">
          <div className="card-header">
            <h3>Ja sorteados</h3>
            <p className="muted">Acompanhamento dos nomes ja revelados.</p>
          </div>
          {drawnNames.length === 0 ? (
            <p className="muted">Nenhum sorteio realizado ainda.</p>
          ) : (
            <ul className="list">
              {drawnNames.map((name, index) => (
                <li className="list-item" key={`${name}-${index}`}>
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {isSoundSettingsOpen && (
        <Modal title="Configuracoes de Som" onClose={closeSoundSettings} isOpen>
          <div className="field-row">
            <span>Som</span>
            <button
              type="button"
              className="audio-toggle-btn"
              onClick={() => setSoundEnabled((prev) => !prev)}
            >
              {soundEnabled ? "On" : "Off"}
            </button>
          </div>
          <div className="field-row">
            <label htmlFor="volume-slider">
              Volume: {Math.round(soundVolume * 100)}%
            </label>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={soundVolume}
              onChange={(e) => setSoundVolume(Number(e.target.value))}
            />
          </div>
          <p className="hint">O volume afeta os sons do sorteio.</p>
        </Modal>
      )}

      {confirmData && (
        <Modal
          isOpen
          title={confirmData.title}
          onClose={closeConfirmModal}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeConfirmModal}>
                Cancelar
              </button>
              <button
                className={`btn ${
                  confirmData.primaryVariant === "danger"
                    ? "btn-danger"
                    : "btn-primary"
                }`}
                onClick={confirmData.action}
              >
                Confirmar
              </button>
            </>
          }
        >
          <p className="muted">{confirmData.message}</p>
        </Modal>
      )}

      <GameModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        onDraw={drawName}
        isDrawing={isDrawing}
        displayedName={displayedName}
        rollingName={rollingName}
        drawnNames={drawnNames}
        namesLeft={names.length}
      />
    </div>
  );
};

export default SecretFriend;
