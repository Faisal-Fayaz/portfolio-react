export default function AboutTerminal() {
  return (
    <section id="about">
      <div className="section-head">
        <div>
          <h2 className="section-title">
            About <span>me</span>
          </h2>
          <div className="section-sub">// quick terminal dump</div>
        </div>
      </div>
      <div className="terminal">
        <div className="terminal-bar">
          <span className="dot r" />
          <span className="dot y" />
          <span className="dot g" />
          <span className="terminal-title">faisal@hangar:~</span>
        </div>
        <div className="terminal-body">
          <div className="t-line">
            <span className="t-prompt">$</span> <span className="t-cmd">whoami</span>
          </div>
          <div className="t-line t-out">Faisal Fayaz — AI/ML + full-stack builder from India.</div>
          <div className="t-line">
            <span className="t-prompt">$</span> <span className="t-cmd">cat mission.txt</span>
          </div>
          <div className="t-line t-out">
            Teach machines to grade, guide, and occasionally recognize digits.
            <br />
            Ship playful systems people can actually run in the browser or offline.
            <br />
            Read the real implementation, write the test, send the fix upstream.
          </div>
          <div className="t-line">
            <span className="t-prompt">$</span> <span className="t-cmd">ls interests/</span>
          </div>
          <div className="t-line t-out">
            <span className="t-hl">browser-games/</span>
            &nbsp;&nbsp;
            <span className="t-hl">on-device-ml/</span>
            &nbsp;&nbsp;
            <span className="t-hl">system-design-sims/</span>
            &nbsp;&nbsp;
            <span className="t-hl">local-ai/</span>
            &nbsp;&nbsp;
            <span className="t-hl">3d-web/</span>
            &nbsp;&nbsp;
            <span className="t-hl">upstream/</span>
          </div>
          <div className="t-line">
            <span className="t-prompt">$</span> <span className="t-cmd">echo $STATUS</span>
          </div>
          <div className="t-line t-out">
            16 public repos · 7 merged PRs into Soup (6.2k★ LLM fine-tune CLI). Still shipping
            LeafScan and polishing IONSTORM.
          </div>
        </div>
      </div>
    </section>
  );
}
