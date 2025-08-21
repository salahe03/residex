import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import './DropdownMenu.css';

const DropdownMenu = ({ 
  trigger, 
  options = [], 
  className = '',
  align = 'left',
  disabled = false,
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (option) => {
    if (option.onClick) {
      option.onClick();
    }
    setIsOpen(false);
  };

  return (
    <div className={`dropdown-wrapper ${className}`} ref={dropdownRef}>
      <motion.button
        className={`dropdown-trigger ${size} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        animate={isOpen ? "open" : "closed"}
      >
        {trigger || (
          <>
            <span>Actions</span>
            <motion.span 
              className="dropdown-chevron"
              variants={chevronVariants}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <FiChevronDown />
            </motion.span>
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`dropdown-menu ${align}`}
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94], // More natural cubic-bezier
              when: "beforeChildren",
              staggerChildren: 0.08
            }}
          >
            {options.map((option, index) => (
              <DropdownOption
                key={option.id || index}
                option={option}
                onClick={() => handleOptionClick(option)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DropdownOption = ({ option, onClick }) => {
  const { text, icon: Icon, color = 'default', disabled = false, divider = false } = option;

  if (divider) {
    return <div className="dropdown-divider" />;
  }

  return (
    <motion.button
      className={`dropdown-option ${color} ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      variants={optionVariants}
      transition={{ 
        duration: 0.25, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      whileHover={disabled ? {} : { x: 2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
    >
      {Icon && (
        <motion.span 
          className="dropdown-option-icon"
          variants={iconVariants}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Icon />
        </motion.span>
      )}
      <span className="dropdown-option-text">{text}</span>
    </motion.button>
  );
};

// Enhanced animation variants with natural easing
const chevronVariants = {
  open: { rotate: 180 },
  closed: { rotate: 0 }
};

const menuVariants = {
  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
      when: "beforeChildren",
      staggerChildren: 0.08
    }
  },
  closed: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

const optionVariants = {
  open: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
      when: "beforeChildren"
    }
  },
  closed: {
    opacity: 0,
    y: -8,
    x: -4,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94],
      when: "afterChildren"
    }
  }
};

const iconVariants = {
  open: { 
    scale: 1, 
    rotate: 0,
    transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  closed: { 
    scale: 0.8, 
    rotate: -10,
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

export default DropdownMenu;