window.MovingSupplies = (function() {
  function renderSupplies(ctx) {
    const { AppEngine, state, esc } = ctx;
    const boxCalculations = AppEngine.calculateSuppliesConfig(state.aptSize);
    return `
      <div class="mt-supply-forecast-title">Your rough box forecast:</div>
      <div class="mt-supply-metrics">
        <div class="mt-supply-badge"><span class="count">${boxCalculations.small}</span><span class="label">Small Boxes</span></div>
        <div class="mt-supply-badge"><span class="count">${boxCalculations.medium}</span><span class="label">Medium Boxes</span></div>
        <div class="mt-supply-badge"><span class="count">${boxCalculations.large}</span><span class="label">Large Boxes</span></div>
        <div class="mt-supply-badge"><span class="count">${boxCalculations.tape} Rolls</span><span class="label">Packing Tape</span></div>
        <div class="mt-supply-badge"><span class="count">${boxCalculations.paper} Packs</span><span class="label">Wrapping Paper</span></div>
      </div>
      <p class="mt-supply-source-copy">
        For the boxes/tape/paper above: <a href="https://www.amazon.com/s?k=moving+boxes+kit" target="_blank" rel="noopener noreferrer">Amazon moving box kits</a>,
        U-Haul's box centers (they buy back unused boxes), or a FedEx Office/The UPS Store if you just need a handful of sturdy ones.
      </p>
      <div class="mt-card">
        <div class="mt-card-header"><h3>Stuff to buy before the tape panic</h3></div>
        <div class="mt-card-body">
          ${AppEngine.SUPPLIES.map((supply, i) => {
            const key = 'supply-' + i;
            const isDone = !!state.checked[key];
            const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(supply.name)}`;
            return `
              <div class="mt-item ${isDone ? 'done' : ''}">
                <input type="checkbox" class="mt-check" data-check="${key}" ${isDone ? 'checked' : ''} aria-label="${esc(supply.name)}" />
                <div class="mt-item-text" data-check="${key}">
                  ${esc(supply.name)}
                  <div class="mt-item-detail">
                    Try: ${esc(supply.store)} · <a href="${amazonUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">Search on Amazon</a>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  return { renderSupplies };
})();
