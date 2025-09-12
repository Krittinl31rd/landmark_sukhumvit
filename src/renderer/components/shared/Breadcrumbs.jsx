import React from "react";
import { Link } from "react-router-dom";

const Breadcrumbs = ({ items }) => {
  return (
    <div className="breadcrumbs text-sm overflow-hidden">
      <ul>
        {items.map((item, idx) => (
          <li key={idx}>
            {item.href ? (
              <Link to={item.href}>{item.label}</Link>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Breadcrumbs;
