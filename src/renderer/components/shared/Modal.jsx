import React from "react";

const Modal = ({ isOpen, title, children, onClose, actions }) => {
  return (
    <>
      <input
        type="checkbox"
        id="reusable-modal"
        className="modal-toggle"
        checked={isOpen}
        onChange={() => {}}
        readOnly
      />
      <div className="modal">
        <div className="modal-box bg-base-300">
          {/* Header */}
          <h3 className="font-bold text-lg">{title}</h3>

          {/* Content */}
          <div className="py-2">{children}</div>

          {/* Actions */}
          <div className="modal-action">
            <button className="btn" onClick={onClose}>
              Close
            </button>
            {actions}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
