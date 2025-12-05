import React from 'react';

interface ContainerProps {
  height: number | string; // np. 200 albo '50vh' albo '100px'
   children?: React.ReactNode;  // <- dokładnie to brakuje
}

export const Separator: React.FC<ContainerProps> = ({ height, children }) => {
  // Jeżeli height jest liczbą, React CSSProperties potraktuje ją jako px
  // jeżeli chcesz mieć pewność co do jednostki, możesz wymusić string: `${height}px`
  const style: React.CSSProperties = {
    width: '100%',
    height: height, 
    // albo: height: typeof height === 'number' ? `${height}px` : height
  };

  return <div style={style}>{children}</div>;
};

export default Separator
