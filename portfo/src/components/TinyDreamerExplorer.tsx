import { useEffect, useRef } from "react";

export const explorerUrl = "/writing-assets/tiny-dreamer/explorer/";

export default function TinyDreamerExplorer() {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    let observer: ResizeObserver | undefined;
    function observeExplorer() {
      observer?.disconnect();
      const diagram = frame?.contentDocument?.getElementById("architecture-explorer");
      if (!frame || !diagram) return;

      const resize = () => {
        frame.style.height = Math.ceil(diagram.getBoundingClientRect().height) + "px";
      };
      resize();
      observer = new ResizeObserver(resize);
      observer.observe(diagram);
    }

    frame.addEventListener("load", observeExplorer);
    observeExplorer();
    return () => {
      frame.removeEventListener("load", observeExplorer);
      observer?.disconnect();
    };
  }, []);

  return (
    <iframe
      ref={frameRef}
      src={explorerUrl}
      title="Interactive TinyDreamer architecture"
      loading="lazy"
      style={{ display: "block", width: "100%", height: 360, border: 0 }}
    />
  );
}
