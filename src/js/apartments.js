window.MovingApartments = (function() {
  const SEARCH_SOURCES = [
    {
      name: 'StreetEasy',
      url: 'https://streeteasy.com/for-rent/nyc',
      bestFor: 'Main NYC search, building history, neighborhood filters, open houses, no-fee/base-rent comparisons.',
      timing: 'Check daily once you are inside 45 days; refresh saved searches morning, lunch, and late afternoon in the final 2 weeks.',
      tip: 'Save very specific searches by commute/neighborhood and cross-check the same building on Openigloo before touring.'
    },
    {
      name: 'Openigloo',
      url: 'https://www.openigloo.com/',
      bestFor: 'Landlord/building reviews, verified listings, rent-stabilized and good-cause leads.',
      timing: 'Use before every serious tour or application, especially when a listing looks unusually cheap.',
      tip: 'Look for repeated complaints about heat, pests, repairs, packages, deposit behavior, and management responsiveness.'
    },
    {
      name: 'NYC Housing Connect',
      url: 'https://housingconnect.nyc.gov/PublicWeb/',
      bestFor: 'Income-restricted affordable lotteries and waitlists.',
      timing: 'Apply continuously; it is usually a long-game channel, not a same-month rescue plan.',
      tip: 'Keep your profile and documents current so you can respond quickly if your log number comes up.'
    },
    {
      name: 'Listings Project',
      url: 'https://www.listingsproject.com/',
      bestFor: 'Vetted community listings, sublets, rooms, creative/live-work spaces, and gentler owner-to-renter leads.',
      timing: 'Check the weekly drop quickly; good listings can disappear the same day.',
      tip: 'Best for Brooklyn/Manhattan community networks and flexible situations where a human note helps.'
    },
    {
      name: 'Leasebreak',
      url: 'https://www.leasebreak.com/',
      bestFor: 'Lease takeovers, sublets, furnished places, rooms, and 1-12 month flexibility.',
      timing: 'Useful when your move date is weird, temporary, or you need a bridge before a long lease.',
      tip: 'Confirm whether it is a lease assignment, true sublet, or new lease, and get landlord approval in writing.'
    },
    {
      name: 'Citysnap',
      url: 'https://www.citysnap.com/nyc',
      bestFor: 'NYC listing cross-checks from the brokerage ecosystem.',
      timing: 'Use alongside StreetEasy when inventory feels thin or listings vanish quickly.',
      tip: 'Compare agent names, fee language, and exact listing terms against the source listing.'
    },
    {
      name: 'RentHop',
      url: 'https://www.renthop.com/nyc/apartments-for-rent',
      bestFor: 'Extra inventory checks, alerts, and neighborhood rent averages.',
      timing: 'Good secondary sweep after your StreetEasy/Openigloo pass.',
      tip: 'Treat duplicate listings as a signal to identify the real listing agent and fastest contact path.'
    },
    {
      name: 'Zillow / Apartments.com / Realtor',
      url: 'https://www.zillow.com/new-york-ny/rentals/',
      bestFor: 'Broad aggregator coverage, especially outside the tightest Manhattan/Brooklyn core.',
      timing: 'Use for comparison, outer-borough options, Jersey City/Hoboken, and larger managed buildings.',
      tip: 'If the same unit appears on several sites, log only the cleanest source and add the others as extra links.'
    },
    {
      name: 'Direct building sites',
      url: '',
      bestFor: 'No-fee managed buildings, luxury rentals, concessions, and openings that may lag on aggregators.',
      timing: 'Use after you shortlist neighborhoods; search building names and management companies directly.',
      tip: 'Especially useful around LIC, Downtown Brooklyn, Williamsburg/Greenpoint waterfront, FiDi, Jersey City, and larger amenity buildings.'
    },
    {
      name: 'Craigslist / Facebook groups',
      url: 'https://newyork.craigslist.org/search/apa',
      bestFor: 'Rooms, private-owner leads, oddball sublets, and last-minute backup options.',
      timing: 'Use carefully when the mainstream sites are too expensive or too slow.',
      tip: 'Never send money before verifying access, identity, lease authority, and the exact unit in person or by trusted live video.'
    }
  ];

  function guideFocusItem(ctx) {
    const { AppEngine, state } = ctx;
    for (const guide of (AppEngine.APT_HUNT_GUIDES || [])) {
      for (let i = 0; i < guide.items.length; i++) {
        const key = `apt-guide-${guide.id}-${i}`;
        if (!state.checked[key]) {
          return { text: guide.items[i], phase: guide.title, tab: 'aptsearch', type: 'apartment', done: { kind: 'check', key } };
        }
      }
    }
    return null;
  }

  function describeDueDate(ctx, dateStr) {
    const days = ctx.daysUntilDate(dateStr);
    if (!dateStr) return '';
    if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  }

  function actionItems(ctx) {
    const actions = [];
    const apartments = ctx.state.apartments || [];

    apartments.forEach((apt, idx) => {
      const name = apt.name || `Apartment ${idx + 1}`;
      const contact = apt.realtorName ? `Contact: ${apt.realtorName}` : 'Apartment pipeline';

      if (apt.cashierCheckNeeded && apt.cashierCheckBy) {
        const days = ctx.daysUntilDate(apt.cashierCheckBy);
        if (days <= 5) {
          actions.push({
            text: `${name}: prep cashier/certified check`,
            phase: `${describeDueDate(ctx, apt.cashierCheckBy)}. Transfer funds before branch pickup if needed.`,
            tab: 'apartments',
            type: 'apartment',
            urgency: days < 0 ? 0 : days
          });
        }
      }

      if (apt.applicationDueDate) {
        const days = ctx.daysUntilDate(apt.applicationDueDate);
        if (days <= 2) {
          actions.push({
            text: `${name}: application deadline`,
            phase: `${describeDueDate(ctx, apt.applicationDueDate)}. Send packet, payment instructions, and references.`,
            tab: 'apartments',
            type: 'apartment',
            urgency: days < 0 ? 0 : days + 1
          });
        }
      }

      if (apt.followUpDate) {
        const days = ctx.daysUntilDate(apt.followUpDate);
        if (days <= 1) {
          actions.push({
            text: `${name}: follow up`,
            phase: `${describeDueDate(ctx, apt.followUpDate)}. ${contact}`,
            tab: 'apartments',
            type: 'apartment',
            urgency: days < 0 ? 0 : days + 2
          });
        }
      }

      if (apt.status === 'Heard Back' && !apt.followUpDate) {
        actions.push({
          text: `${name}: set the next follow-up`,
          phase: 'They replied. Pick a follow-up date or schedule the viewing.',
          tab: 'apartments',
          type: 'apartment',
          urgency: 4
        });
      }

      if (apt.status === 'Viewing Scheduled' && !apt.viewedDate) {
        actions.push({
          text: `${name}: add viewing date after the tour`,
          phase: 'After touring, record the viewed date and next step before details blur.',
          tab: 'apartments',
          type: 'apartment',
          urgency: 5
        });
      }
    });

    return actions
      .sort((a, b) => a.urgency - b.urgency)
      .filter((item, idx, arr) => arr.findIndex(other => other.text === item.text) === idx)
      .slice(0, 5);
  }

  function trackerFocusItem(ctx) {
    return actionItems(ctx)[0] || null;
  }

  function renderSearchSources(ctx) {
    const { esc } = ctx;
    return `
      <div class="mt-card mt-source-card-wrap">
        <div class="mt-card-header"><h3>Where to search</h3></div>
        <div class="mt-card-body">
          <div class="mt-source-grid">
            ${SEARCH_SOURCES.map(source => `
              <div class="mt-source-card">
                <div class="mt-source-title">
                  ${source.url
                    ? `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.name)}</a>`
                    : `<span>${esc(source.name)}</span>`}
                </div>
                <p>${esc(source.bestFor)}</p>
                <div class="mt-source-meta"><strong>When:</strong> ${esc(source.timing)}</div>
                <div class="mt-source-meta"><strong>Tip:</strong> ${esc(source.tip)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderAptSearch(ctx) {
    const { AppEngine, state, esc, renderPhaseList } = ctx;
    const neighborhoods = state.neighborhoods || [];
    const outreach = AppEngine.APT_OUTREACH_GUIDE || {};
    const guideCards = (AppEngine.APT_HUNT_GUIDES || []).map(guide => `
      <div class="mt-card">
        <div class="mt-card-header"><h3>${esc(guide.emoji)} ${esc(guide.title)}</h3></div>
        <div class="mt-card-body">
          ${guide.items.map((item, i) => {
            const key = `apt-guide-${guide.id}-${i}`;
            const isDone = !!state.checked[key];
            return `
              <div class="mt-item ${isDone ? 'done' : ''}">
                <input type="checkbox" class="mt-check" data-check="${key}" ${isDone ? 'checked' : ''} aria-label="${esc(item)}" />
                <div class="mt-item-text" data-check="${key}">${esc(item)}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');

    return `
      <div class="mt-alert-box">
        <strong>Apartment hunt cheat sheet:</strong> The best listings tend to matter most closer to move-in, so being ready beats endless browsing. Keep your renter docs ready before you tour.
      </div>
      ${renderSearchSources(ctx)}
      <div class="mt-card" style="margin-bottom:16px; border-color: rgba(52,199,89,0.22); background: rgba(52,199,89,0.035);">
        <div class="mt-card-header"><h3>NYC application readiness</h3></div>
        <div class="mt-card-body" style="padding:16px 20px;">
          <div class="mt-two-col-list">
            <div>
              <strong>Before serious tours</strong>
              <ul>
                <li>Build a renter packet folder with ID, pay stubs, employment letter, bank statements, credit info, references, and guarantor docs if needed.</li>
                <li>Transfer likely move-in funds to a branch bank several business days before you may need cashier or certified checks.</li>
                <li>Ask agents which payment types they require before ordering any check.</li>
              </ul>
            </div>
            <div>
              <strong>When applying</strong>
              <ul>
                <li>Confirm the exact payee and amount in writing before getting cashier checks.</li>
                <li>Track application fee, security deposit, first month, broker fee, and receipts separately.</li>
                <li>In New York, application/background-check fees are generally capped at $20, and security deposits are generally capped at one month.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-card" style="margin-bottom:16px;">
        <div class="mt-card-header"><h3>Search setup</h3></div>
        <div class="mt-card-body">
          <div class="mt-two-col-form">
            <label>City / market<input type="text" id="mt-city-input" placeholder="e.g. New York, Chicago, Austin" value="${esc(state.city || '')}" /></label>
            <label>Add neighborhood<input type="text" id="mt-neighborhood-input" placeholder="e.g. Park Slope" /></label>
          </div>
          <button class="mt-wizard-btn" id="mt-neighborhood-add" style="width:auto; padding:10px 14px; margin-top:8px;">Add neighborhood</button>
          <div class="mt-chip-row" style="margin-top:12px;">
            ${neighborhoods.length ? neighborhoods.map((n, i) => `<span class="mt-chip">${esc(n)} <button data-neighborhood-remove="${i}" aria-label="Remove ${esc(n)}">×</button></span>`).join('') : '<span class="mt-empty">No neighborhoods yet. Add a few so this stops feeling like a one-person app.</span>'}
          </div>
        </div>
      </div>
      <div class="mt-guide-grid">${guideCards}</div>
      <div class="mt-card mt-template-card">
        <div class="mt-card-header"><h3>Agent outreach playbook</h3></div>
        <div class="mt-card-body" style="padding:16px 20px;">
          <div class="mt-two-col-list">
            <div>
              <strong>Best timing</strong>
              <ul>${(outreach.bestTimes || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
            </div>
            <div>
              <strong>If they do not respond</strong>
              <ul>${(outreach.followUp || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
            </div>
          </div>
          <div class="mt-template-grid">
            <label>Email template<textarea class="mt-script-box">${esc(outreach.emailTemplate || '')}</textarea></label>
            <label>Phone script<textarea class="mt-script-box">${esc(outreach.phoneScript || '')}</textarea></label>
          </div>
        </div>
      </div>
      <div class="mt-card" style="margin: 0 0 16px 0; border-color: rgba(0,122,255,0.16); background: rgba(0,122,255,0.035);">
        <div class="mt-card-body" style="padding:14px 18px; font-size:13px; line-height:1.5;">
          <strong>NYC note:</strong> the FARE Act changed broker-fee rules in 2025. If a landlord's broker tries to charge you, verify who they represent before paying anything. Keep this note editable/removable for non-NYC users.
        </div>
      </div>
      ${renderPhaseList(AppEngine.APT_PHASES)}
    `;
  }

  function getListingSourceInfo(url) {
    if (!url) return { hostname: 'Listing URL', faviconUrl: '🏢' };
    try {
      const parsedUrl = new URL(url);
      return {
        hostname: parsedUrl.hostname.replace('www.', ''),
        faviconUrl: `<img src="https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=32" alt="favicon" style="width:28px; height:28px; object-fit:contain;" />`
      };
    } catch (e) {
      return { hostname: 'External Reference Link', faviconUrl: '🔗' };
    }
  }

  const BLOCKED_PREVIEW_DOMAINS = ['streeteasy.com', 'zillow.com', 'apartments.com'];
  function isKnownBlockedDomain(url) {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      return BLOCKED_PREVIEW_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
    } catch (e) {
      return false;
    }
  }

  async function fetchListingPreview(url) {
    if (isKnownBlockedDomain(url)) return null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const json = await res.json();
      const imageUrl = json?.data?.image?.url || json?.data?.logo?.url;
      return imageUrl ? { image: imageUrl } : null;
    } catch (e) {
      return null;
    }
  }

  function compressImageFile(file, maxWidth) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, maxWidth / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderApartmentPipeline(ctx, list) {
    const { AppEngine, esc } = ctx;
    const statuses = AppEngine.APT_STATUSES || [];
    if (!list.length) {
      return `
        <div class="mt-card mt-pipeline-card">
          <div class="mt-card-header"><h3>Apartment pipeline</h3></div>
          <div class="mt-card-body">
            <div class="mt-empty">Add apartments to turn this into a stage-by-stage hunt board.</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="mt-card mt-pipeline-card">
        <div class="mt-card-header"><h3>Apartment pipeline</h3></div>
        <div class="mt-pipeline-board">
          ${statuses.map(status => {
            const items = list.filter(a => (a.status || 'Saved') === status);
            return `
              <div class="mt-pipeline-column">
                <div class="mt-pipeline-head">
                  <span>${esc(status)}</span>
                  <strong>${items.length}</strong>
                </div>
                <div class="mt-pipeline-items">
                  ${items.length ? items.slice(0, 4).map(a => `
                    <div class="mt-pipeline-item">
                      <strong>${esc(a.name || 'Untitled apartment')}</strong>
                      <span>${a.price ? '$' + parseFloat(a.price).toLocaleString() + '/mo' : 'Rent TBD'}${a.followUpDate ? ` · Follow up ${esc(a.followUpDate)}` : ''}</span>
                    </div>
                  `).join('') : '<em>No listings</em>'}
                  ${items.length > 4 ? `<em>+${items.length - 4} more</em>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderApartments(ctx) {
    const { AppEngine, state, esc, renderRentDropdownHtml } = ctx;
    const list = state.apartments || [];
    const filter = state.aptFilter || 'all';
    const needsFollowUp = list.filter(a => a.status === 'Needs Follow-up' || !!a.followUpDate);
    const visibleList = filter === 'favorites'
      ? list.filter(a => a.favorite)
      : (filter === 'followup' ? needsFollowUp : list);
    const maxTargetRent = parseFloat(state.targetBudgetMax) || 0;

    const cards = visibleList.length ? visibleList.slice().reverse().map((a) => {
      const i = list.indexOf(a);
      const status = a.status || 'Saved';
      let statusClass = 'mt-badge-optimal';
      if (status === 'Needs Follow-up') statusClass = 'mt-badge-stretching';
      else if (status === 'Applied') statusClass = 'mt-badge-stretching';
      else if (status === 'Rejected') statusClass = 'mt-badge-fail';
      else if (status === 'Lease Signed') statusClass = 'mt-badge-success';

      const links = a.links && a.links.length ? a.links : (a.url ? [a.url] : []);
      const primaryUrl = links[0];
      const { hostname, faviconUrl } = getListingSourceInfo(primaryUrl);
      const imageFrame = a.image
        ? `<img src="${esc(a.image)}" alt="${esc(a.name)}" />`
        : faviconUrl;

      const minRentText = a.minRent ? `$${parseFloat(a.minRent).toLocaleString()}` : "Any";
      const maxRentText = a.maxRent ? `$${parseFloat(a.maxRent).toLocaleString()}` : "Any";

      const extraChips = links.slice(1).map(link => {
        const info = getListingSourceInfo(link);
        return `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer" class="mt-apt-link-chip">${esc(info.hostname)}</a>`;
      }).join(' ');

      return `
        <div class="mt-apt-card">
          <div class="mt-apt-card-top">
            <div>
              <h4 style="margin:0 0 4px 0; font-size:16px;">${esc(a.name)}</h4>
              <span style="font-size:12px; color:var(--text-muted); font-weight:500;">Target rent: ${minRentText} – ${maxRentText}</span>
              <div style="margin-top: 10px;">
                ${AppEngine.APT_STATUSES.map(s => `
                  <button data-apt-status="${i}" data-status-val="${s}"
                    style="font-size: 10px; padding: 3px 8px; margin-right: 4px; margin-top: 4px; border-radius: 4px; border: 1px solid var(--border-color); cursor: pointer; ${status === s ? 'background: var(--accent-primary); color: white;' : 'background: white;'}"
                  >${s}</button>
                `).join('')}
              </div>
            </div>
            <div style="text-align:right;">
              <button data-apt-favorite="${i}" class="mt-apt-favorite-btn" aria-label="Toggle favorite">${a.favorite ? '★' : '☆'}</button>
              <div class="mt-apt-price">${a.price ? '$' + parseFloat(a.price).toLocaleString() + '/mo' : '—'}</div>
              <span class="mt-apt-status ${statusClass}">${status}</span>
            </div>
          </div>

          ${primaryUrl ? `
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <a href="${esc(primaryUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display:block; flex:1; min-width:0;">
                <div class="mt-apt-imessage-bubble">
                  <div class="mt-apt-image-frame">${imageFrame}</div>
                  <div class="mt-apt-preview-text">
                    <span class="mt-apt-preview-headline">${esc(a.name || 'View Apartment Listing')}</span>
                    <span class="mt-apt-preview-sub">${esc(hostname)}</span>
                  </div>
                </div>
              </a>
              ${!a.image ? `
                <label class="mt-apt-photo-cta">
                  📷 Add photo
                  <input type="file" accept="image/*" data-apt-photo="${i}" style="display:none;" />
                </label>
              ` : ''}
            </div>
          ` : ''}

          ${extraChips ? `<div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">${extraChips}</div>` : ''}

          <div class="mt-apt-detail-grid">
            <label>Realtor / contact<input type="text" data-apt-field="${i}" data-apt-field-name="realtorName" value="${esc(a.realtorName || '')}" placeholder="Name, phone, email" /></label>
            <label>Last contact<input type="date" data-apt-field="${i}" data-apt-field-name="lastContactDate" value="${esc(a.lastContactDate || '')}" /></label>
            <label>Viewed date<input type="date" data-apt-field="${i}" data-apt-field-name="viewedDate" value="${esc(a.viewedDate || '')}" /></label>
            <label>Follow up on<input type="date" data-apt-field="${i}" data-apt-field-name="followUpDate" value="${esc(a.followUpDate || '')}" /></label>
            <label>Apply by<input type="date" data-apt-field="${i}" data-apt-field-name="applicationDueDate" value="${esc(a.applicationDueDate || '')}" /></label>
            <label>Cashier check by<input type="date" data-apt-field="${i}" data-apt-field-name="cashierCheckBy" value="${esc(a.cashierCheckBy || '')}" /></label>
          </div>
          <label class="mt-box-check" style="margin-top:10px;">
            <input type="checkbox" data-apt-check-field="${i}" data-apt-field-name="cashierCheckNeeded" ${a.cashierCheckNeeded ? 'checked' : ''} />
            Cashier/certified check may be needed for this one
          </label>
          <label class="mt-apt-notes-label">
            Notes / application plan
            <textarea data-apt-field="${i}" data-apt-field-name="notes" placeholder="What happened, what to send next, payment instructions, broker notes...">${esc(a.notes || '')}</textarea>
          </label>

          <div style="margin-top: 12px; display:flex; gap:14px; flex-wrap:wrap; align-items:center;">
            <button data-apt-addlink="${i}" style="font-size: 11px; background: none; border: none; color: var(--accent-primary); cursor: pointer; padding:0;">+ Add another source</button>
            ${a.image ? `
              <label style="font-size: 11px; color: var(--accent-primary); cursor: pointer;">
                📷 Replace photo
                <input type="file" accept="image/*" data-apt-photo="${i}" style="display:none;" />
              </label>
            ` : ''}
            <button data-apt-remove="${i}" style="font-size: 11px; background: none; border: none; color: var(--accent-danger); cursor: pointer; padding:0;">Delete Listing</button>
          </div>
        </div>
      `;
    }).join('') : `<div class="mt-empty">${filter === 'favorites' ? 'No favorites yet — tap ☆ on a listing to save it here.' : 'No apartments logged yet.'}</div>`;

    return `
      ${renderApartmentPipeline(ctx, list)}
      <div class="mt-income-wrapper">
        <label>Target Budget Range ($/mo):</label>
        <div style="display:flex; gap:10px; align-items:center; margin-bottom: 12px;">
          ${renderRentDropdownHtml('mt-apt-min-rent', 'Min Target Rent', state.targetBudgetMin || '')}
          <span style="color: var(--text-muted); font-weight:600;">–</span>
          ${renderRentDropdownHtml('mt-apt-max-rent', 'Max Target Rent', state.targetBudgetMax || '')}
        </div>
        ${maxTargetRent > 0 ? `
          <p style="font-size: 12.5px; color: var(--text-muted); margin: 0; line-height: 1.45;">
            Sanity check: for a $${maxTargetRent.toLocaleString()}/mo max, many landlords look for income around
            <strong>$${(maxTargetRent * 40).toLocaleString()}/year</strong> under the common 40x rent rule.
          </p>
        ` : ''}
      </div>
      <div class="mt-apt-form" style="display:flex; flex-direction:column; gap:10px; margin-top: 20px;">
        <input type="text" id="mt-apt-name" placeholder="Address / Building Name" style="width:100%; box-sizing:border-box;" />
        <input type="url" id="mt-apt-url" placeholder="Paste Listing URL Link (StreetEasy, Zillow, etc.)" style="width:100%; box-sizing:border-box;" />
        <input type="number" id="mt-apt-price" placeholder="Rent Amount/mo" style="width:100%; box-sizing:border-box;" />
        <button class="mt-wizard-btn" id="mt-apt-submit" style="width: 100%;">Add Apartment</button>
      </div>
      <div style="margin-top: 20px; display:flex; gap:8px; flex-wrap:wrap;">
        <button data-apt-filter="all" class="mt-apt-filter-tab ${filter === 'all' ? 'active' : ''}">All (${list.length})</button>
        <button data-apt-filter="favorites" class="mt-apt-filter-tab ${filter === 'favorites' ? 'active' : ''}">★ Favorites (${list.filter(a => a.favorite).length})</button>
        <button data-apt-filter="followup" class="mt-apt-filter-tab ${filter === 'followup' ? 'active' : ''}">Follow up (${needsFollowUp.length})</button>
      </div>
      <div style="margin-top: 16px;">
        ${cards}
      </div>
    `;
  }

  function attachHandlers(ctx) {
    const { root, state, AppEngine, render } = ctx;

    const cityInput = root.querySelector('#mt-city-input');
    if (cityInput) {
      cityInput.addEventListener('blur', () => {
        state.city = cityInput.value.trim();
        AppEngine.saveState(state);
      });
    }

    const neighborhoodAdd = root.querySelector('#mt-neighborhood-add');
    if (neighborhoodAdd) {
      neighborhoodAdd.addEventListener('click', () => {
        const input = root.querySelector('#mt-neighborhood-input');
        const val = input ? input.value.trim() : '';
        if (!val) return;
        if (!state.neighborhoods) state.neighborhoods = [];
        if (!state.neighborhoods.some(n => n.toLowerCase() === val.toLowerCase())) state.neighborhoods.push(val);
        AppEngine.saveState(state);
        render();
      });
    }

    root.querySelectorAll('[data-neighborhood-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-neighborhood-remove'), 10);
        state.neighborhoods.splice(idx, 1);
        AppEngine.saveState(state);
        render();
      });
    });

    const aptSubmit = root.querySelector('#mt-apt-submit');
    if (aptSubmit) {
      aptSubmit.addEventListener('click', () => {
        const name = root.querySelector('#mt-apt-name').value.trim();
        const price = root.querySelector('#mt-apt-price').value;
        const url = root.querySelector('#mt-apt-url').value.trim();
        const minRent = root.querySelector('#mt-apt-min-rent').value;
        const maxRent = root.querySelector('#mt-apt-max-rent').value;

        if (!name || !price) return alert('Building Address and Monthly Rent are required.');

        state.apartments.push({
          name, price, minRent, maxRent, status: 'Saved',
          links: url ? [url] : [], favorite: false, image: null, imageStatus: 'none',
          realtorName: '', lastContactDate: '', viewedDate: '', followUpDate: '',
          applicationDueDate: '', cashierCheckNeeded: false, cashierCheckBy: '', notes: ''
        });
        const newIdx = state.apartments.length - 1;
        AppEngine.saveState(state);
        render();

        if (url) {
          fetchListingPreview(url).then(preview => {
            const apt = state.apartments[newIdx];
            if (preview && apt && apt.imageStatus !== 'manual') {
              apt.image = preview.image;
              apt.imageStatus = 'auto';
              AppEngine.saveState(state);
              render();
            }
          });
        }
      });
    }

    root.querySelectorAll('[data-apt-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-apt-status'), 10);
        state.apartments[idx].status = btn.getAttribute('data-status-val');
        AppEngine.saveState(state);
        render();
      });
    });

    root.querySelectorAll('[data-apt-favorite]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-apt-favorite'), 10);
        state.apartments[idx].favorite = !state.apartments[idx].favorite;
        AppEngine.saveState(state);
        render();
      });
    });

    root.querySelectorAll('[data-apt-field]').forEach(input => {
      input.addEventListener('change', () => {
        const idx = parseInt(input.getAttribute('data-apt-field'), 10);
        const field = input.getAttribute('data-apt-field-name');
        if (!state.apartments[idx] || !field) return;
        state.apartments[idx][field] = input.value;
        if (field === 'viewedDate' && input.value && state.apartments[idx].status === 'Viewing Scheduled') {
          state.apartments[idx].status = 'Viewed';
        }
        if (field === 'followUpDate' && input.value && ['Saved', 'Inquired', 'Heard Back'].includes(state.apartments[idx].status)) {
          state.apartments[idx].status = 'Needs Follow-up';
        }
        AppEngine.saveState(state);
        render();
      });
      input.addEventListener('blur', () => {
        const idx = parseInt(input.getAttribute('data-apt-field'), 10);
        const field = input.getAttribute('data-apt-field-name');
        if (!state.apartments[idx] || !field) return;
        state.apartments[idx][field] = input.value;
        AppEngine.saveState(state);
      });
    });

    root.querySelectorAll('[data-apt-check-field]').forEach(input => {
      input.addEventListener('change', () => {
        const idx = parseInt(input.getAttribute('data-apt-check-field'), 10);
        const field = input.getAttribute('data-apt-field-name');
        if (!state.apartments[idx] || !field) return;
        state.apartments[idx][field] = input.checked;
        AppEngine.saveState(state);
        render();
      });
    });

    root.querySelectorAll('[data-apt-addlink]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-apt-addlink'), 10);
        const url = prompt('Paste another listing link for this apartment (StreetEasy, Zillow, etc.):');
        if (!url || !url.trim()) return;
        const apt = state.apartments[idx];
        if (!apt.links) apt.links = [];
        apt.links.push(url.trim());
        AppEngine.saveState(state);
        render();

        if (!apt.image) {
          fetchListingPreview(url.trim()).then(preview => {
            if (preview && apt.imageStatus !== 'manual') {
              apt.image = preview.image;
              apt.imageStatus = 'auto';
              AppEngine.saveState(state);
              render();
            }
          });
        }
      });
    });

    root.querySelectorAll('[data-apt-photo]').forEach(input => {
      input.addEventListener('change', async () => {
        const idx = parseInt(input.getAttribute('data-apt-photo'), 10);
        const file = input.files[0];
        if (!file) return;
        try {
          const dataUrl = await compressImageFile(file, 480);
          state.apartments[idx].image = dataUrl;
          state.apartments[idx].imageStatus = 'manual';
          AppEngine.saveState(state);
          render();
        } catch (e) {
          alert('Could not load that photo — try a different file.');
        }
      });
    });

    root.querySelectorAll('[data-apt-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.aptFilter = btn.getAttribute('data-apt-filter');
        AppEngine.saveState(state);
        render();
      });
    });

    root.querySelectorAll('[data-apt-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-apt-remove'), 10);
        state.apartments.splice(idx, 1);
        AppEngine.saveState(state);
        render();
      });
    });
  }

  return {
    actionItems,
    attachHandlers,
    guideFocusItem,
    renderApartments,
    renderAptSearch,
    trackerFocusItem
  };
})();
