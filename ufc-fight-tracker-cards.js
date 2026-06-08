// Piggyback LitElement from Home Assistant
const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const { html, css } = LitElement.prototype;

class UfcFightTrackerLiteCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object }
    };
  }

  static getConfigElement() {
    return document.createElement("ufc-fight-tracker-lite-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:ufc-fight-tracker-lite-card",
      entity: ""
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define an entity (e.g. sensor.ufc_fight_tracker_00)');
    }
    this.config = config;
  }

  getCardSize() {
    return 5;
  }

  getGridOptions() {
    return {
      columns: 24,
      rows: "auto",
      min_columns: 12,
      min_rows: 1
    };
  }

  _getAvatar(src, id, name, side) {
    const ESPN_HEADSHOT = 'https://a.espncdn.com/i/headshots/mma/players/full/';
    const imgSrc = src || (id ? `${ESPN_HEADSHOT}${id}.png` : null);
    if (imgSrc) {
      return html`<div class="ufc-avatar ${side}"><img src="${imgSrc}" alt="${name || 'fighter'}"></div>`;
    }
    
    let initials = '?';
    if (name) {
      initials = name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
    }
    return html`<div class="ufc-avatar ${side} ufc-avatar--fallback">${initials}</div>`;
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    const stateObj = this.hass.states[this.config.entity];
    if (!stateObj) {
      return html`
        <ha-card>
          <div style="padding:16px;color:var(--secondary-text-color)">Entity not available: ${this.config.entity}</div>
        </ha-card>
      `;
    }

    const v = stateObj.attributes || {};

    const gameDate = v.date ? new Date(v.date) : null;
    let gameday = '', gamedate = '', gametime = '';
    if (gameDate && !isNaN(gameDate.getTime())) {
      const now = new Date();
      const todayStr = now.toDateString();
      const tmrStr = new Date(now.getTime() + 86400000).toDateString();
      const gameDateStr = gameDate.toDateString();
      
      if (gameDateStr === todayStr) {
        gameday = 'Today';
      } else if (gameDateStr === tmrStr) {
        gameday = 'Tomorrow';
      } else {
        gameday = gameDate.toLocaleDateString(undefined, { weekday: 'long' });
      }
      gamedate = gameDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      gametime = gameDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }

    const isDraw = !!v.last_play && !v.team_winner && !v.opponent_winner;

    return html`
      <ha-card>
        <div class="ufc-wrap">
          <div class="ufc-topbar">
            <div class="ufc-brand">
              <div class="ufc-event-name">${v.event_name || 'Fight Night'}</div>
            </div>
          </div>
          <div class="ufc-header-venue">
            <div class="ufc-header-venue-text">${v.venue || ''}${v.location ? ', ' + v.location : ''}</div>
          </div>
          ${(gameday || gamedate || gametime) ? html`<div class="ufc-time">${gameday}${gamedate ? ' · ' + gamedate : ''}${gametime ? ' · ' + gametime : ''}</div>` : ''}
          <div class="ufc-card-segment${v.cardSegment ? '' : ' ufc-card-segment--ghost'}">${v.cardSegment || 'CARD'}</div>
          <div class="ufc-divider"></div>
          
          <div class="ufc-main">
            <div class="ufc-fighter ufc-fighter--left ${(v.team_winner || isDraw) ? 'winner' : ''} ${v.opponent_winner ? 'loser' : ''}">
              ${v.team_winner ? html`<div class="winner-badge">WINNER</div>` : ''}
              ${this._getAvatar(v.team_headshot, v.team_id, v.team_name, 'left')}
              <div class="ufc-fighter-meta">
                <div class="ufc-rank">${v.team_rank || ''}</div>
                <div class="ufc-name">${v.team_name || 'Fighter 1'}</div>
                <div class="ufc-sub">${v.team_record || ''}</div>
                ${v.team_logo ? html`<div class="ufc-country"><img class="ufc-flag" src="${v.team_logo}" alt="${v.team_country || ''}"><span>${v.team_country || ''}</span></div>` : ''}
              </div>
            </div>
            
            <div class="ufc-center">
              ${isDraw ? html`<div class="winner-badge draw-badge">DRAW</div>` : ''}
              ${(v.weight_class || v.round_info || v.event_type) ? html`<div class="ufc-center-badge">${v.event_type || 'MAIN EVENT'}</div>` : ''}
              ${(v.weight_class || v.round_info) ? html`
              <div class="ufc-bout-info">
                ${v.weight_class ? html`<div class="ufc-center-sub">${v.weight_class} Bout</div>` : ''}
                ${v.round_info ? html`<div class="ufc-center-sub">${v.round_info} Rounds</div>` : ''}
              </div>` : ''}
              <div class="ufc-vs">VS</div>
            </div>
            
            <div class="ufc-fighter ufc-fighter--right ${(v.opponent_winner || isDraw) ? 'winner' : ''} ${v.team_winner ? 'loser' : ''}">
              ${v.opponent_winner ? html`<div class="winner-badge">WINNER</div>` : ''}
              ${this._getAvatar(v.opponent_headshot, v.opponent_id, v.opponent_name, 'right')}
              <div class="ufc-fighter-meta ufc-fighter-meta--right">
                <div class="ufc-rank">${v.opponent_rank || ''}</div>
                <div class="ufc-name">${v.opponent_name || 'Fighter 2'}</div>
                <div class="ufc-sub">${v.opponent_record || ''}</div>
                ${v.opponent_logo ? html`<div class="ufc-country ufc-country--right"><span>${v.opponent_country || ''}</span><img class="ufc-flag" src="${v.opponent_logo}" alt="${v.opponent_country || ''}"></div>` : ''}
              </div>
            </div>
          </div>
          
          ${(stateObj.state === 'IN' || v.win_type || v.score_card || v.last_play) ? html`
          <div class="ufc-footer ufc-footer--${stateObj.state === 'IN' ? 'center' : (v.team_winner ? 'left' : (v.opponent_winner ? 'right' : 'center'))} corner--${stateObj.state === 'IN' ? 'live' : (v.team_winner ? 'red' : (v.opponent_winner ? 'blue' : 'draw'))}">
            ${stateObj.state === 'IN' ? html`
              <div class="footer-pill footer-pill--live">
                <span class="live-dot"></span> LIVE ${v.period ? '· ROUND ' + v.period : ''}
              </div>
              <div class="live-disclaimer">*Status may be delayed by up to a minute</div>
            ` : html`
              ${v.win_type ? html`<div class="footer-pill footer-pill--win-type">${v.win_type}</div>` : 
                (v.last_play ? html`<div class="footer-pill footer-pill--win-type">${v.last_play}</div>` : '')}
              ${(v.score_card && v.win_type) ? html`<div class="footer-pill footer-pill--score-card">${v.score_card}</div>` : 
                ((v.win_type && v.period && v.displayClock) ? html`<div class="footer-pill footer-pill--score-card">Round ${v.period} @ ${v.displayClock}</div>` : '')}
            `}
          </div>
          ` : ''}
        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      ha-card {
        border-radius: 18px;
        overflow: hidden;
        box-sizing: border-box;
      }
      .ufc-wrap {
        position: relative;
        background:
          radial-gradient(circle at top left, rgba(220,38,38,0.10), transparent 28%),
          radial-gradient(circle at top right, rgba(59,130,246,0.10), transparent 28%),
          var(--ha-card-background, var(--card-background-color, var(--secondary-background-color)));
        color: var(--primary-text-color);
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
        box-shadow: var(--ha-card-box-shadow, none);
        font-family: Inter, Arial, sans-serif;
      }
      .ufc-wrap::before {
        content: '';
        position: absolute;
        inset: 0 0 auto 0;
        height: 4px;
        background: linear-gradient(90deg, #d71920 0%, #d71920 48%, #2563eb 52%, #2563eb 100%);
      }
      .ufc-topbar {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 18px 18px 6px;
      }
      .ufc-brand {
        text-align: center;
      }
      .ufc-header-venue {
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 4px 18px 0;
      }
      .ufc-header-venue-text {
        font-size: 11px;
        font-weight: 600;
        color: var(--secondary-text-color);
        line-height: 1.3;
      }
      .ufc-event-name {
        font-size: 20px;
        font-weight: 800;
        line-height: 1.1;
        color: var(--primary-text-color);
      }
      .ufc-time {
        display: block;
        text-align: center;
        font-size: 12px;
        color: var(--secondary-text-color);
        font-weight: 600;
        padding: 4px 18px 6px;
      }
      .ufc-card-segment {
        display: block;
        text-align: center;
        font-size: 20px;
        font-weight: 800;
        line-height: 1.1;
        color: var(--primary-text-color);
        padding: 4px 18px 14px;
      }
      .ufc-card-segment--ghost {
        color: transparent;
        user-select: none;
        pointer-events: none;
      }
      .ufc-divider {
        height: 1px;
        background: var(--divider-color);
        margin: 0 16px;
      }
      .ufc-main {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 12px;
        align-items: center;
        padding: 18px 16px 16px;
      }
      .ufc-fighter {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        min-width: 0;
        position: relative;
        transition: all 0.3s ease;
      }
      .ufc-fighter--left { align-items: flex-start; }
      .ufc-fighter--right { align-items: flex-end; }
  
      /* Winner / Loser States */
      .ufc-fighter.loser {
        opacity: 0.4;
        filter: grayscale(100%);
        transform: scale(0.95);
      }
      .ufc-fighter.winner .ufc-avatar img {
        filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.4));
        transform: scale(1.05) translateY(-2px);
      }
      .winner-badge {
        position: absolute;
        top: -10px;
        background: #D3AF37;
        color: #fff;
        font-size: 10px;
        font-weight: 900;
        padding: 4px 12px;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 0 4px 10px rgba(211, 175, 55, 0.4);
        z-index: 10;
      }
      .ufc-fighter--left .winner-badge {
        left: 12px;
      }
      .ufc-fighter--right .winner-badge {
        right: 12px;
      }
      .draw-badge {
        top: auto;
        bottom: calc(100% + 15px);
        left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
      }
  
      .ufc-fighter-meta { min-width: 0; width: 100%; text-align: left; }
      .ufc-fighter-meta--right { text-align: right; }
      .ufc-rank {
        font-size: 11px;
        font-weight: 800;
        color: #9ca3af;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .ufc-name {
        font-size: 18px;
        font-weight: 800;
        line-height: 1.1;
        color: var(--primary-text-color);
        word-break: break-word;
      }
      .ufc-sub {
        margin-top: 4px;
        font-size: 12px;
        color: var(--secondary-text-color);
        font-weight: 600;
      }
      .ufc-country {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 4px;
        font-size: 12px;
        color: var(--secondary-text-color);
        font-weight: 600;
      }
      .ufc-country--right {
        justify-content: flex-end;
      }
      .ufc-flag {
        width: 18px;
        height: 13px;
        object-fit: cover;
        border-radius: 2px;
        flex-shrink: 0;
      }
      .ufc-avatar {
        width: 160px;
        height: 160px;
        flex-shrink: 0;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        overflow: hidden;
        background: transparent;
      }
      .ufc-avatar img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center bottom;
        display: block;
        transition: all 0.3s ease;
      }
      .ufc-avatar--fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        width: 58px;
        height: 58px;
        background: linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04)), #23262b;
        color: #ffffff;
        font-size: 18px;
        font-weight: 800;
      }
      .ufc-center {
        text-align: center;
        padding: 0 6px;
        position: relative;
      }
      .ufc-center-badge {
        display: inline-block;
        margin-bottom: 8px;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(255,255,255,0.06);
        color: #d1d5db;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .ufc-vs {
        font-size: 22px;
        font-weight: 900;
        letter-spacing: 0.08em;
        color: var(--primary-text-color);
        margin-bottom: 6px;
      }
      .ufc-center-sub {
        font-size: 12px;
        font-weight: 700;
        color: #9ca3af;
        line-height: 1.35;
      }
      .ufc-bout-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 0 16px 14px;
        margin-top: -8px;
      }
      .ufc-footer {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 16px;
        background: linear-gradient(90deg, rgba(215,25,32,0.05) 0%, rgba(37,99,235,0.05) 100%);
        border-top: 1px solid var(--divider-color);
      }
      .ufc-footer--left {
        align-items: flex-start;
      }
      .ufc-footer--right {
        align-items: flex-end;
      }
      .ufc-footer--center {
        align-items: center;
      }
      .footer-pill {
        color: #fff;
        font-weight: 900;
        padding: 4px 12px;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      }
      .corner--red .footer-pill {
        background: linear-gradient(135deg, #ef4444, #dc2626); /* Red */
        box-shadow: 0 4px 10px rgba(220, 38, 38, 0.4);
      }
      .corner--blue .footer-pill {
        background: linear-gradient(135deg, #3b82f6, #2563eb); /* Blue */
        box-shadow: 0 4px 10px rgba(37, 99, 235, 0.4);
      }
      .corner--draw .footer-pill {
        background: linear-gradient(90deg, rgba(215,25,32,0.85) 0%, rgba(37,99,235,0.85) 100%);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      }
      .corner--live .footer-pill {
        background: linear-gradient(135deg, #e11d48, #be123c);
        box-shadow: 0 4px 10px rgba(225, 29, 72, 0.4);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .live-dot {
        width: 6px;
        height: 6px;
        background-color: #fff;
        border-radius: 50%;
        animation: pulse-live 1.5s infinite ease-in-out;
      }
      @keyframes pulse-live {
        0% { transform: scale(0.8); opacity: 0.5; }
        50% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(0.8); opacity: 0.5; }
      }
      .live-disclaimer {
        font-size: 9px;
        color: var(--secondary-text-color);
        text-transform: none;
        letter-spacing: 0.5px;
        margin-top: 2px;
        text-align: center;
      }
      .footer-pill--win-type {
        font-size: 10px;
      }
      .footer-pill--score-card {
        font-size: 10px;
      }
    `;
  }
}

class UfcFightTrackerLiteCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object }
    };
  }

  setConfig(config) {
    this._config = config;
  }

  _valueChanged(ev) {
    if (!this._config || !this.hass) {
      return;
    }
    const newValue = ev.detail.value;
    if (this._config.entity === newValue.entity) {
      return;
    }
    this._config = { ...this._config, ...newValue };
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }
    
    const schema = [
      {
        name: "entity",
        selector: { entity: { domain: "sensor" } }
      }
    ];

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${schema}
        .computeLabel=${(s) => s.name === "entity" ? "UFC Sensor Entity" : s.name}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }
}

customElements.define('ufc-fight-tracker-lite-card', UfcFightTrackerLiteCard);
customElements.define('ufc-fight-tracker-lite-card-editor', UfcFightTrackerLiteCardEditor);

class UfcFightTrackerEventCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _filter: { type: String }
    };
  }

  constructor() {
    super();
    this._filter = "All";
  }

  static getConfigElement() {
    return document.createElement("ufc-fight-tracker-event-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:ufc-fight-tracker-event-card",
      auto_detect: true,
      entities: []
    };
  }

  setConfig(config) {
    this.config = config;
  }

  getCardSize() {
    return 10;
  }

  _setFilter(f) {
    this._filter = f;
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    let entities = [];
    if (this.config.auto_detect !== false) {
      entities = Object.keys(this.hass.states)
        .filter(e => e.startsWith("sensor.ufc_fight_tracker_"))
        .sort();
    } else if (this.config.entities && Array.isArray(this.config.entities)) {
      entities = this.config.entities;
    }

    if (entities.length === 0) {
      return html`
        <ha-card>
          <div style="padding:16px;">No UFC sensors found. Make sure auto_detect is true or entities are selected.</div>
        </ha-card>
      `;
    }

    const segments = new Set();
    const entityData = [];
    entities.forEach(ent => {
      const stateObj = this.hass.states[ent];
      if (stateObj && stateObj.attributes) {
        const state = stateObj.state ? stateObj.state.toLowerCase() : 'unknown';
        if (state === 'unknown' || state === 'unavailable') return;
        
        const seg = stateObj.attributes.cardSegment;
        if (!seg || seg.toLowerCase() === 'unknown') return;

        segments.add(seg);
        entityData.push({ id: ent, segment: seg });
      }
    });

    const sortedSegments = ["All", ...Array.from(segments)];
    const visibleEntities = entityData.filter(e => this._filter === "All" || e.segment === this._filter);

    return html`
      <div class="event-card-wrap">
        <div class="filter-chips">
          ${sortedSegments.map(s => html`
            <div class="chip ${this._filter === s ? 'active' : ''}" @click=${() => this._setFilter(s)}>
              ${s}
            </div>
          `)}
        </div>
        
        <div class="event-list">
          ${visibleEntities.map(e => html`
            <ufc-fight-tracker-lite-card .hass=${this.hass} .config=${{ entity: e.id }}></ufc-fight-tracker-lite-card>
          `)}
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      .event-card-wrap {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .filter-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        padding: 0 4px;
        margin-bottom: 4px;
      }
      .chip {
        padding: 8px 16px;
        border-radius: 999px;
        background: var(--secondary-background-color, rgba(255,255,255,0.1));
        color: var(--primary-text-color);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
      }
      .chip:hover {
        background: var(--divider-color, rgba(255,255,255,0.2));
      }
      .chip.active {
        background: linear-gradient(135deg, #d71920, #dc2626);
        color: #fff;
        border-color: transparent;
        box-shadow: 0 4px 10px rgba(220, 38, 38, 0.3);
      }
      .event-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
    `;
  }
}

class UfcFightTrackerEventCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object }
    };
  }

  setConfig(config) {
    this._config = config;
  }

  _valueChanged(ev) {
    if (!this._config || !this.hass) {
      return;
    }
    const newValue = ev.detail.value;
    this._config = { ...this._config, ...newValue };
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    const schema = [
      {
        name: "auto_detect",
        selector: { boolean: {} }
      },
      {
        name: "entities",
        selector: { entity: { multiple: true, domain: "sensor" } }
      }
    ];

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${schema}
        .computeLabel=${(s) => {
          if (s.name === "auto_detect") return "Auto-detect UFC sensors (recommended)";
          if (s.name === "entities") return "Manual Entities (if auto-detect is off)";
          return s.name;
        }}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }
}

customElements.define('ufc-fight-tracker-event-card', UfcFightTrackerEventCard);
customElements.define('ufc-fight-tracker-event-card-editor', UfcFightTrackerEventCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ufc-fight-tracker-lite-card",
  name: "UFC Fight Tracker Lite Card",
  description: "A beautifully designed custom card to display UFC fight sensors natively."
});
window.customCards.push({
  type: "ufc-fight-tracker-event-card",
  name: "UFC Fight Tracker Event Card",
  description: "A multi-entity card that automatically tracks and filters all UFC fights for an event."
});
