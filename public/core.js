/* Funções puras compartilhadas pela interface, pelos relatórios e pelos testes. */
(function (root) {
  const clean = value => String(value ?? '').trim();
  const fold = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function numeric(value) {
    const raw = clean(value);
    if (!raw) return null;
    const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
    return /^[+-]?\d+(\.\d+)?$/.test(normalized) && Number.isFinite(Number(normalized)) ? Number(normalized) : null;
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + 'T12:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  // Nenhuma linha é removida. Valores inválidos ficam visíveis e fora dos cálculos.
  function ingest(csv, papa) {
    const parsed = papa.parse(csv.replace(/^\uFEFF/, ''), {header: true, skipEmptyLines: 'greedy'});
    const fields = parsed.meta.fields || [];
    const required = ['id_venda', 'data', 'quantidade', 'preco_unitario'];
    const keys = Object.fromEntries(fields.map(key => [fold(key), key]));
    const missing = required.filter(key => !keys[key]);
    if (missing.length) throw new Error('Colunas obrigatórias ausentes: ' + missing.join(', '));
    const issues = [];
    const rowErrors = new Map();
    parsed.errors.forEach(error => {
      if (error.row !== undefined) rowErrors.set(error.row, error.message);
      else if (error.code !== 'UndetectableDelimiter') throw new Error('CSV malformado: ' + error.message);
    });
    const rows = parsed.data.map((raw, index) => {
      const data = Object.fromEntries(fields.map(key => [key, raw[key] ?? '']));
      const get = key => data[keys[key]] ?? '';
      const reasons = [];
      if (rowErrors.has(index)) reasons.push('Estrutura CSV: ' + rowErrors.get(index));
      if (raw.__parsed_extra) data.colunas_excedentes = raw.__parsed_extra.join(' | ');
      if (!clean(get('id_venda'))) reasons.push('ID ausente');
      if (!validDate(clean(get('data')))) reasons.push('Data ausente ou inválida');
      const qty = numeric(get('quantidade')), price = numeric(get('preco_unitario'));
      if (qty === null || qty < 0 || !Number.isInteger(qty)) reasons.push('Quantidade ausente, negativa ou não inteira');
      if (price === null || price < 0) reasons.push('Preço ausente ou inválido');
      const revenue = qty !== null && price !== null ? Math.round(qty * price * 100) / 100 : null;
      if (revenue !== null && !Number.isSafeInteger(Math.round(revenue * 100))) reasons.push('Valor fora do limite numérico');
      const row = {data, line: index + 2, valid: !reasons.length, reasons, id: clean(get('id_venda')),
        date: clean(get('data')), qty, price, revenue, search: fold(Object.values(data).join(' '))};
      if (reasons.length) issues.push({registro: index + 1, id: row.id, motivo: reasons.join('; '), ...data});
      return row;
    });
    if (rows.some(row => 'colunas_excedentes' in row.data)) fields.push('colunas_excedentes');
    return {rows, fields, issues, keys, total: rows.length};
  }
  const value = (row, key, keys) => row.data[keys[key] || key] ?? '';
  function stats(rows, keys) {
    const valid = rows.filter(row => row.valid), cents = valid.reduce((sum, row) => sum + Math.round(row.revenue * 100), 0);
    const revenue = cents / 100, sales = new Set(valid.map(row => row.id)).size;
    const waits = valid.map(row => numeric(value(row, keys.tempo_atendimento_min ? 'tempo_atendimento_min' : 'tempo_espera_min', keys))).filter(n => n !== null && n >= 0);
    const hasCosts = Boolean(keys.custo_unitario), costs = valid.map(row => numeric(value(row, 'custo_unitario', keys)));
    const completeCosts = hasCosts && valid.length > 0 && costs.every(n => n !== null && n >= 0);
    const cost = completeCosts ? valid.reduce((sum, row, i) => sum + row.qty * costs[i], 0) : null;
    return {revenue, sales, units: valid.reduce((sum, row) => sum + row.qty, 0), ticket: sales ? revenue / sales : 0,
      valid: valid.length, total: rows.length, wait: waits.length ? waits.reduce((a,b) => a+b,0) / waits.length : null,
      margin: cost !== null && revenue > 0 ? (revenue - cost) / revenue * 100 : null};
  }
  function group(rows, key, keys) {
    const map = new Map();
    rows.filter(row => row.valid).forEach(row => {
      const name = clean(value(row, key, keys)) || 'Não informado';
      const item = map.get(name) || {name, cents: 0, units: 0, ids: new Set()};
      item.cents += Math.round(row.revenue * 100); item.units += row.qty; item.ids.add(row.id); map.set(name, item);
    });
    return [...map.values()].map(item => ({name:item.name, revenue:item.cents/100, units:item.units, sales:item.ids.size})).sort((a,b) => b.revenue-a.revenue);
  }
  function monthly(rows) {
    const map = new Map();
    rows.filter(row => row.valid).forEach(row => {const key=row.date.slice(0,7);map.set(key,(map.get(key)||0)+Math.round(row.revenue*100));});
    const months = [...map.keys()].sort();
    if (!months.length) return [];
    const result = [], last = months.at(-1); let cursor = months[0], guard = 0;
    while (cursor <= last && guard++ < 1200) {
      result.push({name:cursor,revenue:(map.get(cursor)||0)/100});
      const [year, month] = cursor.split('-').map(Number);
      cursor = month === 12 ? (year+1)+'-01' : year+'-'+String(month+1).padStart(2,'0');
    }
    // Bases com mais de 100 anos exibem apenas os meses presentes.
    return cursor <= last ? months.map(name=>({name,revenue:map.get(name)/100})) : result;
  }
  const api = {clean, fold, numeric, validDate, ingest, stats, group, monthly, value};
  root.DataCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);

