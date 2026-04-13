/* ═══════════════════════════════════════════
   SCRAPER NEXUS — js/discord/webhook.js
   Discord embed builder + sender
   ═══════════════════════════════════════════ */

const DiscordWebhook = (() => {

  const PLATFORM_COLORS = {
    twitter:  0x1DA1F2,
    reddit:   0xFF4500,
    rss:      0xFFA500,
    web:      0x00D4FF,
    github:   0x7B68EE,
    youtube:  0xFF0000,
  };

  const PLATFORM_ICONS = {
    twitter: '🐦',
    reddit:  '👾',
    rss:     '📡',
    web:     '🌐',
    github:  '🐙',
    youtube: '▶️',
  };

  function buildEmbed(agent, item) {
    const color = parseInt((agent.features?.embedColor || '#7c3aed').replace('#',''), 16)
                  || PLATFORM_COLORS[agent.platform]
                  || 0x7c3aed;

    const embed = {
      color,
      title: item.title || item.text?.slice(0, 80) || 'New result',
      description: item.text?.slice(0, 350) || undefined,
      url: item.url || undefined,
      footer: {
        text: `🤖 Scraper Nexus · ${agent.name} · ${new Date().toLocaleString('en-ZA')}`,
      },
      timestamp: new Date().toISOString(),
      fields: [],
    };

    if (item.platform === 'twitter') {
      if (item.date) embed.fields.push({ name: '⏱ Posted', value: item.date, inline: true });
    }
    if (item.platform === 'reddit') {
      if (item.score !== undefined) embed.fields.push({ name: '⬆️ Score', value: String(item.score), inline: true });
      if (item.author)              embed.fields.push({ name: '👤 Author', value: `u/${item.author}`, inline: true });
      if (item.subreddit)           embed.fields.push({ name: '📌 Sub', value: `r/${item.subreddit}`, inline: true });
    }
    if (item.platform === 'github') {
      embed.fields.push({ name: '📦 Event', value: item.title, inline: true });
    }

    if (item.thumbnail && agent.features?.includeThumbnails) {
      embed.thumbnail = { url: item.thumbnail };
    }

    if (embed.fields.length === 0) delete embed.fields;

    return embed;
  }

  function buildPayload(agent, item) {
    const icon = PLATFORM_ICONS[agent.platform] || '🔍';
    const mention = agent.features?.mentionRole
      ? `<@&${agent.features.mentionRole}> `
      : '';
    const custom = agent.features?.customMessage
      ? agent.features.customMessage + '\n'
      : '';

    return {
      username: `${icon} ${agent.name}`,
      avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
      content: `${mention}${custom}`.trim() || undefined,
      embeds: [buildEmbed(agent, item)],
    };
  }

  async function send(agent, item) {
    const webhook = agent.discordWebhook || Storage.getSettings().discordWebhook;
    if (!webhook) throw new Error('No Discord webhook URL configured');
    if (!webhook.startsWith('https://discord.com/api/webhooks/') &&
        !webhook.startsWith('https://discordapp.com/api/webhooks/')) {
      throw new Error('Invalid Discord webhook URL');
    }

    const payload = buildPayload(agent, item);

    const resp = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Discord ${resp.status}: ${text.slice(0, 100)}`);
    }

    Events.emit(EV.DISCORD_SENT, { agentId: agent.id, item });
    return true;
  }

  // ── Test webhook ──
  async function test(webhookUrl, agentName = 'Test Agent') {
    if (!webhookUrl) throw new Error('No webhook URL');
    const payload = {
      username: '🤖 Scraper Nexus',
      embeds: [{
        color: 0x7c3aed,
        title: '✅ Webhook test successful!',
        description: `**${agentName}** is connected and ready to receive scraped data.`,
        footer: { text: `Scraper Nexus · ${new Date().toLocaleString('en-ZA')}` },
        timestamp: new Date().toISOString(),
      }],
    };

    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Discord ${resp.status}: ${text}`);
    }
    return true;
  }

  return { send, test, buildEmbed, buildPayload };
})();

window.DiscordWebhook = DiscordWebhook;
