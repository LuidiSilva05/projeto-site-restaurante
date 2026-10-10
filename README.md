# Gestão — painel gastronômico executivo

Dashboard em português, com tema escuro, Playfair Display nos títulos e Inter na interface. HTML, CSS e JavaScript puro: sem backend, banco de dados, instalação ou compilação para executar.

## Abrir e entrar

Abra **public/index.html** no navegador, com internet para carregar as bibliotecas, fontes e fotografias. O HTML principal incorpora os estilos, o código e as bases iniciais: pode ser compartilhado sozinho.

Selecione um perfil na tela de acesso para preencher a conta de demonstração e clique em **Entrar no portal**:

| Perfil | E-mail | Permissões da interface |
| --- | --- | --- |
| CEO / Diretor | diretor@empresa.com.br | Consultar, importar e exportar |
| Gerente Financeiro | financeiro@empresa.com.br | Consultar, importar e exportar |
| Auditor de Qualidade | auditor@empresa.com.br | Consultar e exportar |

Senha de todas as contas: **Demonstracao2026!**

O login, a recuperação e as opções SSO são simulações. Não há provedor conectado, e-mail enviado ou autenticação de servidor. Permissões no JavaScript podem ser contornadas: esta versão não protege informações confidenciais e não está pronta para operar como SaaS multiempresa. Nenhuma senha é salva; a sessão expira em 8 horas ou 7 dias com “Lembrar-me”. O indicador de conexão informa HTTPS apenas quando o navegador realmente usa HTTPS.

## Dados completos, sem truncamento

O arquivo original **vendas_hamburgueria.csv** foi preservado na raiz. A cópia incorporada contém **1.367 registros, 12 colunas originais, 2.060 unidades e R$ 36.506,00**. Não existe um arquivo real de 1.635 linhas neste workspace.

A base **dados-corporativos.csv** é uma demonstração separada com **1.635 registros fictícios**. A seleção da base identifica essa origem. Não se completou a base real com registros inventados. A antiga amostra de 12 linhas em dados-exemplo.csv foi mantida como material de atividade e não é mais carregada na abertura.

Todas as colunas do CSV aparecem na tabela. Há paginação de 10, 50, 100, 500 e Todos, busca global, ordenação numérica/textual, seleção de colunas e filtros combinados. Ocultar colunas e paginar não reduz o conteúdo dos relatórios.

Importe um CSV UTF-8 com cabeçalho. Colunas obrigatórias: id_venda, data, quantidade e preco_unitario. Datas: AAAA-MM-DD. Números: ponto decimal, ou vírgula decimal em um CSV delimitado por ponto e vírgula/campo entre aspas. CSV é interpretado com Papa Parse, incluindo BOM e detecção de delimitador.

O CSV importado é mantido no armazenamento local deste navegador, quando disponível. Uma nova importação substitui a anterior; a base original permanece disponível no seletor. Dados não são enviados a um servidor de análise. A biblioteca e as fotos são requisitadas a provedores externos. Use dados de demonstração em apresentações públicas.

## Validação e fórmulas

Nenhuma linha de dados não vazia é silenciosamente removida. Linhas inválidas continuam na tabela e nas exportações com a coluna de validação; ficam excluídas somente dos cálculos. Cabeçalho incompatível ou falha estrutural fatal rejeita a importação inteira e mantém a base anterior.

- Faturamento calculado = quantidade × preço unitário, arredondado em centavos por linha.
- Total = soma dos centavos das linhas válidas do recorte.
- Vendas = contagem de id_venda distintos das linhas válidas.
- Unidades = soma das quantidades válidas.
- Ticket = total ÷ vendas; zero se não houver vendas.
- Margem bruta = (receita − soma de quantidade × custo_unitario) ÷ receita × 100. Só aparece com custo válido em todas as linhas e receita positiva.
- Atendimento médio = média dos tempos preenchidos e não negativos em tempo_atendimento_min ou tempo_espera_min. Zero é válido; vazio não é zero.
- Contratos ativos = IDs distintos em id_contrato cujo status é exatamente Ativo.
- Conversão B2B = respostas Sim ÷ respostas Sim ou Não em conversao_b2b.

Datas impossíveis, IDs vazios, números inválidos, preços negativos e quantidades negativas/fracionárias são sinalizados. IDs repetidos não são deduplicados. Uma venda com várias linhas contribui uma vez para o número de vendas e todas as suas linhas para a receita.

A base original não possui região, custos, contratos ou conversão. A comparação regional é adaptada para canal; métricas indisponíveis são apresentadas como tal. Não se inventam retenção, conformidade, risco regulatório ou margem.

## Gráficos e assistente

Chart.js apresenta evolução mensal, receita por categoria, participação de região/canal e matriz de unidades × receita. Meses intermediários sem vendas aparecem com zero, no intervalo dos meses presentes.

O assistente gera resumos, variação entre os dois últimos meses disponíveis e rankings calculados localmente. Não existe IA generativa/API conectada. A interface informa essa limitação; nenhuma chave de API é solicitada. Conclusões sobre margem, preço e expansão são limitadas pela ausência de custos, demanda e localização. Períodos podem estar incompletos.

## Relatórios

O seletor de escopo usa **Base completa** por padrão. Troque para **Recorte filtrado** quando necessário.

- CSV: todas as linhas e colunas do escopo, incluindo ocorrências. BOM UTF-8 e proteção de textos interpretáveis como fórmulas.
- Excel XLSX: abas Resumo, Dados do escopo, Base original completa, Recorte filtrado, Categorias, Mensal e Validação. A receita calculada é numérica e formatada como moeda. O resumo e os agrupamentos usam o mesmo escopo.
- PDF: use Imprimir / salvar PDF e escolha Salvar como PDF no navegador. Capa, resumo, gráficos e tabela integral em paisagem; não há limite artificial de 500 linhas. Uma base grande gera muitas páginas.
- Ocorrências: CSV separado dos registros que precisam de revisão.

Não se exporta arquivo nativo do Power BI (.pbix). O relatório tem apresentação executiva e os dados podem ser importados em ferramentas de BI.

## Organização

- public/index.html: entrega em arquivo único, com CSS, scripts e bases incorporados.
- public/index-modular.html: mesma página usando os arquivos abaixo, para facilitar manutenção.
- public/styles.css: layout, tipografia, responsividade e impressão.
- public/core.js: validação e cálculos puros.
- public/login.js: autenticação demonstrativa.
- public/script.js: filtros, tabela, gráficos, assistente e exportações.
- public/data.js: cópia integral da base original e demonstração corporativa.
- public/dados-corporativos.csv: demonstração fictícia de 1.635 linhas.
- tests/check.cjs: verificações isoladas de dados, cálculo, filtros, login e relatórios.

As duas versões HTML devem ser sincronizadas após edições de CSS/JS/dados. Nenhum passo de compilação é necessário para abrir ou publicar a entrega.

## Dependências e imagens

CDNs com versões fixadas: Chart.js 4.4.4, Papa Parse 5.4.1, SheetJS 0.20.3 e Lucide 0.468.0. SheetJS é carregado de sua [CDN oficial](https://docs.sheetjs.com/docs/getting-started/installation/standalone/). Playfair Display e Inter vêm do Google Fonts.

Fotografias ilustrativas do Unsplash, sem relação com produtos reais do CSV:
- Hambúrguer: https://images.unsplash.com/photo-1568901346375-23c9450c58cd
- Hambúrguer na tela de acesso: https://images.unsplash.com/photo-1550547660-d9450f859349
- Batatas: https://images.unsplash.com/photo-1573080496219-bb080dd4f877
- Sorvete: https://images.unsplash.com/photo-1563805042-7684c019e1cb

Mesmo em arquivo único, CDNs, fontes e fotografias exigem internet. Sem Papa Parse os dados não inicializam; a página informa o erro. Sem Chart.js a tabela e os cálculos permanecem disponíveis; sem SheetJS pode-se exportar CSV.

## Publicar no Render

1. Envie o projeto a um repositório GitHub.
2. Crie um **Static Site** no Render e conecte o repositório.
3. Branch: a branch que contém o projeto.
4. Root Directory: vazio.
5. Build Command: echo "Site pronto"
6. Publish Directory: public.

A publicação torna acessíveis as bases incorporadas ao site, inclusive sem passar pela tela de login. Publique apenas conteúdo autorizado para acesso público.

## Verificações realizadas

Execute node tests/check.cjs na raiz, se desejar repetir os testes de lógica.

Passaram: correspondência da cópia com o CSV original; 1.367 registros e 12 colunas; 1.635 registros da demonstração; totais conhecidos; ausente versus zero; datas impossíveis; repetição de IDs; filtros combinados, busca sem resultados e limpeza; paginação; relatórios sem truncamento; escopos completos/filtrados; rejeição de credenciais incorretas; bloqueio de importação pelo auditor; não persistência de senhas.

Os testes usam adaptadores de DOM, Papa Parse e SheetJS. Eles validam nossa lógica, não o funcionamento das CDNs, a renderização dos gráficos ou o download real de XLSX/PDF.

A inicialização do Chrome para inspeção visual foi bloqueada pelo ambiente com Acesso negado (IPC/Crashpad). A instalação de Playwright também foi bloqueada por rede. Aparência em desktop/celular, fotografias externas e downloads reais continuam pendentes de conferência manual no navegador.

