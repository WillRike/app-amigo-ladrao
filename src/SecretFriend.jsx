import React, { useState } from "react";

const SecretFriend = () => {
  const [names, setNames] = useState([]);
  const [input, setInput] = useState("");
  const [drawnNames, setDrawnNames] = useState([]);
  const [currentDraw, setCurrentDraw] = useState("");

  const addName = () => {
    if (input.trim() && !names.includes(input)) {
      setNames([...names, input.trim()]);
      setInput("");
    }
  };

  const drawName = () => {
    if (names.length > 0) {
      const randomIndex = Math.floor(Math.random() * names.length);
      const drawnName = names[randomIndex];
      setDrawnNames([...drawnNames, drawnName]);
      setNames(names.filter((name, index) => index !== randomIndex));
      setCurrentDraw(drawnName);
    }
  };

  const resetGame = () => {
    setNames([...names, ...drawnNames]);
    setDrawnNames([]);
    setCurrentDraw("");
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Amigo Ladrão 🎉</h1>
        <p>Adicione os nomes e clique para sortear um por vez!</p>
      </header>

      <div className="input-section">
        <input
          type="text"
          placeholder="Digite um nome"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={addName}>Adicionar</button>
      </div>

      <div className="draw-section">
        <button
          className="draw-button"
          onClick={drawName}
          disabled={names.length === 0}
        >
          Sortear Próximo 🎲
        </button>
        {currentDraw && (
          <p className="current-draw">Sorteado: {currentDraw}!</p>
        )}
      </div>

      <div className="names-list">
        <h3>Nomes adicionados:</h3>
        <ul>
          {names.map((name, index) => (
            <li key={index}>{name}</li>
          ))}
        </ul>

        <h3>Nomes sorteados:</h3>
        <ul>
          {drawnNames.map((name, index) => (
            <li key={index}>{name}</li>
          ))}
        </ul>
      </div>

      <button className="reset-button" onClick={resetGame}>
        Resetar Sorteio 🔄
      </button>
    </div>
  );
};

export default SecretFriend;
