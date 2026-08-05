export default function SplitWords({ text, className = "" }) {
    return text.split(" ").map((word, i) => (
        <span key={i} className="inline-block pb-[0.08em] align-bottom">
            <span data-word className={`inline-block will-change-transform ${className}`}>
                {word}
                {"\u00A0"}
            </span>
        </span>
    ));
}
