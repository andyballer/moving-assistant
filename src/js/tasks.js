window.MovingTasks = (function() {
  function renderPhaseList(ctx, phases) {
    const { state, esc, getDynamicCalendarRange } = ctx;
    return phases.map(phase => {
      return `
        <div class="mt-card">
          <div class="mt-card-header">
            <h3>${esc(phase.label)}</h3>
            <span class="date-range">${getDynamicCalendarRange(state.targetMoveDate, phase.weeksOut)}</span>
          </div>
          <div class="mt-card-body">
            ${phase.items.map((text, i) => {
              const key = phase.id + '-' + i;
              const isDone = !!state.checked[key];
              return `
                <div class="mt-item ${isDone ? 'done' : ''}">
                  <input type="checkbox" class="mt-check" data-check="${key}" ${isDone ? 'checked' : ''} aria-label="${esc(text)}" />
                  <div class="mt-item-text" data-check="${key}">${esc(text)}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  function getBuildingGuidance(ctx) {
    if (ctx.isHouseMove()) {
      return {
        title: 'House / standalone logistics',
        summary: 'This move is more about access, staging, utilities, and large-item paths than building paperwork.',
        items: [
          'Confirm truck parking, driveway clearance, and whether the curb/street can handle loading without blocking neighbors.',
          'Pick a staging zone before move day: garage, basement, porch, driveway, or the clearest room near the exit.',
          'Walk the large-item path for couches, mattresses, desks, and appliances; measure tight doors, stairs, and turns.',
          'Check trash, bulk pickup, yard/garage cleanup, and utility shutoff/start responsibilities before handoff.'
        ]
      };
    }

    return {
      title: 'Apartment / building logistics',
      summary: 'This move depends on building approval and timing more than muscle. Lock the paperwork early.',
      items: [
        'Ask both buildings for COI wording, elevator or loading-dock rules, move windows, and any fees.',
        'Send the exact COI wording to the booked mover and forward the completed certificate back for approval.',
        'Reserve freight elevator or loading slots as soon as the building allows it.',
        'Keep super, doorman, management, and elevator contact details in Address & Utilities.'
      ]
    };
  }

  function getMoveStyleGuidance(ctx) {
    if (ctx.isDiyMove()) {
      return {
        title: 'DIY move plan',
        summary: 'Your risk is not a quote surprise; it is underestimating time, weight, parking, and helper fatigue.',
        items: [
          'Reserve the rental vehicle early and check pickup/return hours, mileage, insurance, and loading equipment.',
          'Assign helpers to time blocks, not vague promises. Confirm who can lift heavy items and who should handle lighter runs.',
          'Borrow or rent dollies, furniture pads, straps, gloves, and basic tools before move week.',
          'Build the loading order: heavy furniture first, boxes by room, open-first boxes last and easy to reach.'
        ]
      };
    }

    return {
      title: 'Mover-assisted plan',
      summary: 'Your risk is vague scope. Make every access detail and fee visible before move day.',
      items: [
        'Compare written quotes using the same inventory, dates, stairs, elevator windows, and long-carry details.',
        'Send photos or a video walkthrough of every room and large item so the crew size, truck, and time estimate match the real move.',
        'Confirm what is included: materials, furniture wrapping, disassembly, COI, travel time, tolls, and cancellation terms.',
        'Ask what must be emptied, wrapped, or disassembled before arrival; dresser and cabinet rules vary by mover and access path.',
        'Send building rules and access notes to the mover as soon as you book.',
        'Call during move week to confirm arrival window, crew size, truck access, and payment/tip plan.'
      ]
    };
  }

  function renderGuidanceCard(ctx, guidance, className) {
    const { esc } = ctx;
    return `
      <div class="mt-card ${className}">
        <div class="mt-card-header"><h3>${esc(guidance.title)}</h3></div>
        <div class="mt-card-body">
          <p class="mt-muted-copy">${esc(guidance.summary)}</p>
          <ul class="mt-tight-list">
            ${guidance.items.map(item => `<li>${esc(item)}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  function renderMoveStyleGuidanceCard(ctx) {
    return renderGuidanceCard(ctx, getMoveStyleGuidance(ctx), 'mt-move-style-guidance');
  }

  function renderBuildingGuidanceCard(ctx) {
    return renderGuidanceCard(ctx, getBuildingGuidance(ctx), 'mt-building-guidance');
  }

  function getBoroughGuidance(ctx) {
    const labels = { manhattan: 'Manhattan', brooklyn: 'Brooklyn', queens: 'Queens', bronx: 'Bronx', 'staten-island': 'Staten Island' };
    const borough = ctx.borough || 'manhattan';
    const isManhattan = borough === 'manhattan';
    return {
      title: `${labels[borough] || 'NYC'} curb + truck check`,
      summary: isManhattan
        ? 'Manhattan includes special Midtown and Lower Manhattan commercial-vehicle rules. Make the mover verify the exact curb and route instead of assuming a normal parking space will work.'
        : 'NYC curb rules are sign-specific and truck routes matter in every borough. Treat the address—not the borough name—as the final answer.',
      items: [
        'Photograph the curb signs at both addresses for the exact move-day hours and restrictions.',
        'Ask the mover where the truck will legally load; NYC loading zones and No Parking areas can allow active loading, while No Standing rules are different.',
        isManhattan
          ? 'Ask specifically whether Midtown or Lower Manhattan commercial-vehicle rules affect the truck, standing time, or route.'
          : 'Confirm the truck route to the destination; commercial vehicles cannot use NYC parkways and must follow posted restrictions.',
        'Recheck alternate-side suspensions and emergency changes close to move day; never rely on an old screenshot.'
      ]
    };
  }

  function renderBoroughGuidanceCard(ctx) {
    const card = renderGuidanceCard(ctx, getBoroughGuidance(ctx), 'mt-borough-guidance');
    return `${card}<p class="mt-source-links">Official checks: <a href="https://www.nyc.gov/html/dot/html/motorist/parking-regulations.shtml" target="_blank" rel="noopener noreferrer">parking rules</a> · <a href="https://www.nyc.gov/html/dot/html/motorist/loading-zones.shtml" target="_blank" rel="noopener noreferrer">loading zones</a> · <a href="https://www.nyc.gov/html/dot/html/motorist/trucks.shtml" target="_blank" rel="noopener noreferrer">truck routes</a></p>`;
  }

  function renderTasks(ctx) {
    return `
      ${ctx.isHouseMove() ? `
        <div class="mt-alert-box">
          <strong>House move focus:</strong> confirm truck access, staging space, stairs, large-item paths, trash pickup, and utility handoff. COI/elevator paperwork usually matters less than whether the truck and furniture can actually move cleanly.
        </div>
      ` : `
        <div class="mt-alert-box">
          <strong>COI = Certificate of Insurance.</strong> Many apartment buildings require your mover to send this proof of insurance before move day. Ask each building for its exact COI wording, send that to your booked mover, then forward the completed COI back to building management for approval.
        </div>
      `}
      <div class="mt-alert-box">
        <strong>Security deposit plan:</strong> check your lease before patching or painting. Usually small nail holes can be spackled, but large damage, paint matching, and wall anchors may have building-specific rules. Keep before/after photos and send your forwarding address when you return keys.
      </div>
      ${renderMoveStyleGuidanceCard(ctx)}
      ${renderBuildingGuidanceCard(ctx)}
      ${renderBoroughGuidanceCard(ctx)}
      ${renderPhaseList(ctx, ctx.getMoveTimelinePhases())}
    `;
  }

  return {
    renderPhaseList,
    renderBuildingGuidanceCard,
    renderBoroughGuidanceCard,
    renderMoveStyleGuidanceCard,
    renderTasks
  };
})();
