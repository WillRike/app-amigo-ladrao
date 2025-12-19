import React, { useEffect, useState } from "react";

const STORAGE_KEYS = {
  names: "secretFriend:names",
  drawnNames: "secretFriend:drawnNames",
  currentDraw: "secretFriend:currentDraw",
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.names, JSON.stringify(names));
  }, [names]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.drawnNames, JSON.stringify(drawnNames));
  }, [drawnNames]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.currentDraw, currentDraw);
  }, [currentDraw]);

  const normalizeName = (name) => name.trim().toLowerCase();
  const hasDrawn = drawnNames.length > 0 || Boolean(currentDraw);

  const addName = () => {
    if (hasDrawn) return;

    const normalizedInput = normalizeName(input);
    if (!normalizedInput) {
      return;
    }

    const isDuplicate = names.some(
      (name) => normalizeName(name) === normalizedInput
    );

    if (isDuplicate) {
      alert("Nome ja adicionado");
      return;
    }

    setNames([...names, input.trim()]);
    setInput("");
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addName();
    }
  };

  const removeName = (index) => {
    if (hasDrawn) return;
    setNames(names.filter((_, idx) => idx !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingValue("");
    }
  };

  const startEditing = (index) => {
    if (hasDrawn) return;
    setEditingIndex(index);
    setEditingValue(names[index]);
  };

  const confirmEdit = (index) => {
    if (editingIndex !== index) return;

    const trimmed = editingValue.trim();
    if (!trimmed) {
      alert("Nome nao pode ser vazio");
      return;
    }

    const normalizedNew = normalizeName(trimmed);
    const isDuplicate = names.some(
      (name, idx) => idx !== index && normalizeName(name) === normalizedNew
    );

    if (isDuplicate) {
      alert("Nome ja adicionado");
      return;
    }

    const updatedNames = [...names];
    updatedNames[index] = trimmed;
    setNames(updatedNames);
    setEditingIndex(null);
    setEditingValue("");
  };

  const handleEditKeyDown = (event, index) => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmEdit(index);
    }
  };

  const drawName = () => {
    if (names.length > 0) {
      const randomIndex = Math.floor(Math.random() * names.length);
      const drawnName = names[randomIndex];
      setDrawnNames([...drawnNames, drawnName]);
      setNames(names.filter((_, index) => index !== randomIndex));
      setCurrentDraw(drawnName);
      setEditingIndex(null);
      setEditingValue("");
    }
  };

  const startNewSession = () => {
    const confirmed = window.confirm(
      "Tem certeza que deseja iniciar uma nova sessao? Isso apagara participantes e resultados."
    );
    if (!confirmed) return;

    localStorage.clear();
    setNames([]);
    setDrawnNames([]);
    setCurrentDraw("");
    setInput("");
    setEditingIndex(null);
    setEditingValue("");
  };

  const restartDrawKeepingParticipants = () => {
    if (!hasDrawn) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja reiniciar o sorteio? Os participantes serao mantidos, mas os resultados serao apagados."
    );
    if (!confirmed) return;

    setNames([...names, ...drawnNames]);
    setDrawnNames([]);
    setCurrentDraw("");
    setEditingIndex(null);
    setEditingValue("");
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Amigo Ladrao</h1>
        <p>Adicione os nomes e clique para sortear um por vez!</p>
      </header>

      <div className="input-section">
        <input
          type="text"
          placeholder="Digite um nome"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        <button onClick={addName} disabled={!input.trim() || hasDrawn}>
          Adicionar
        </button>
      </div>

      <div className="draw-section">
        <button
          className="draw-button"
          onClick={drawName}
          disabled={names.length === 0}
        >
          Sortear Proximo
        </button>
        <button
          className="draw-button"
          onClick={restartDrawKeepingParticipants}
          disabled={!hasDrawn}
        >
          Reiniciar sorteio (manter participantes)
        </button>
        {currentDraw && (
          <p className="current-draw">Sorteado: {currentDraw}!</p>
        )}
      </div>

      <div className="names-list">
        <h3>Nomes adicionados:</h3>
        <ul>
          {names.map((name, index) => (
            <li key={index}>
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

              {!hasDrawn && editingIndex !== index && (
                <>
                  <button onClick={() => startEditing(index)}>Editar</button>
                  <button onClick={() => removeName(index)}>Remover</button>
                </>
              )}
            </li>
          ))}
        </ul>

        <h3>Nomes sorteados:</h3>
        <ul>
          {drawnNames.map((name, index) => (
            <li key={index}>{name}</li>
          ))}
        </ul>
      </div>

      <button className="reset-button" onClick={startNewSession}>
        Nova sessao
      </button>
    </div>
  );
};

export default SecretFriend;
