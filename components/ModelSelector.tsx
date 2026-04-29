import React from 'react';

interface Props {
  selectedModel: string;
  onSelect: (model: string) => void;
}

const MODELS = [
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', desc: 'Frontier-class, reasoning mạnh' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'Cân bằng chi phí/hiệu năng' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Lite', desc: 'Nhanh nhất, rẻ nhất' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', desc: 'Chất lượng cao nhất' },
];

const ModelSelector: React.FC<Props> = ({ selectedModel, onSelect }) => {
  return (
    <div className="model-selector">
      <div className="model-selector-title">Chọn Model AI</div>
      <div className="model-cards">
        {MODELS.map((m) => (
          <button
            key={m.id}
            className={`model-card ${selectedModel === m.id ? 'model-card--active' : ''}`}
            onClick={() => onSelect(m.id)}
            title={m.desc}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector;
