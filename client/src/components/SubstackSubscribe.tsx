export function SubstackSubscribe() {
  return (
    <div className="flex justify-center">
      <iframe
        src="https://startupforyou.substack.com/embed"
        width="480"
        height="320"
        style={{ border: "1px solid #EEE", background: "white", maxWidth: "100%" }}
        frameBorder="0"
        scrolling="no"
        title="Substack 訂閱表單"
      />
    </div>
  );
}
