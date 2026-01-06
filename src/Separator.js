import { jsx as _jsx } from "react/jsx-runtime";
export const Separator = ({ height, children }) => {
    // Jeżeli height jest liczbą, React CSSProperties potraktuje ją jako px
    // jeżeli chcesz mieć pewność co do jednostki, możesz wymusić string: `${height}px`
    const style = {
        width: '100%',
        height: height,
        // albo: height: typeof height === 'number' ? `${height}px` : height
    };
    return _jsx("div", { style: style, children: children });
};
export default Separator;
