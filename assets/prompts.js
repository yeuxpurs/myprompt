/* Curated templates. Each localized body works independently when copied. */
window.MYPROMPT_PROMPTS = [
  {
    id: 'source-led-article', category: 'writing', icon: 'pen', tags: ['article', 'brief', 'sources'],
    translations: {
      ja: { tags: ['記事', '制作要件', '出典'], title: '資料から、読まれる記事へ', description: '企画と資料を、読者に届く構成と検証可能な原稿に。', body: `テーマ：{{テーマ}}
読者と読後に取ってほしい行動：{{読者と目的}}
使用する資料：{{資料}}
掲載先・分量・文体：{{掲載条件}}

資料をもとに、見出し案を3つ、短い構成案、完成原稿の順に作成してください。冒頭で読者にとっての価値を示し、具体例で論点を支えてください。事実と解釈を区別し、出典がある主張には資料名やリンクを付けてください。根拠のない数字、引用、体験談は作らず、不足情報は末尾の「要確認」にまとめてください。重複や宣伝的な表現を削り、掲載条件に合わせて仕上げてください。` },
      zh: { tags: ['文章', '创作要求', '来源'], title: '把资料写成值得读的文章', description: '从选题和资料出发，完成结构清晰、事实可核查的成稿。', body: `主题：{{主题}}
目标读者及期望行动：{{读者与目的}}
参考资料：{{资料}}
发布渠道、篇幅与语气：{{发布要求}}

请依次提供3个标题、简短提纲和完整文章。开头说明文章对读者的价值，用具体例子支撑观点。区分事实与解读，对有依据的论断标注资料名称或链接。不要编造数据、引语或亲身经历；缺失信息放在文末的“待核实”中。删去重复和空泛的营销话术，按发布要求交付可直接编辑的成稿。` },
      en: { tags: ['article', 'brief', 'sources'], title: 'Turn a brief into a grounded article', description: 'A clear argument, useful examples, and a draft you can fact-check.', body: `Topic: {{topic}}
Readers and desired action: {{audience and purpose}}
Source material: {{sources}}
Channel, length, and voice: {{publication requirements}}

Deliver three headline options, a short outline, and a complete article. Lead with why this matters to the reader and support the argument with concrete examples. Separate sourced facts from interpretation; attach source names or links to supported claims. Do not invent statistics, quotations, or personal experience. List missing evidence under “To verify” after the draft. Remove repetition and empty marketing language, and check the final piece against the publication requirements.` },
      vi: { tags: ['bài viết', 'yêu cầu', 'nguồn tài liệu'], title: 'Biến đề bài thành bài viết có căn cứ', description: 'Lập luận rõ, ví dụ hữu ích và bản thảo có thể kiểm chứng.', body: `Chủ đề: {{chủ đề}}
Độc giả và hành động mong muốn: {{độc giả và mục tiêu}}
Tài liệu tham khảo: {{nguồn tài liệu}}
Kênh đăng, độ dài và giọng văn: {{yêu cầu xuất bản}}

Hãy cung cấp lần lượt 3 tiêu đề, dàn ý ngắn và bài viết hoàn chỉnh. Mở đầu bằng giá trị đối với độc giả, dùng ví dụ cụ thể để làm rõ lập luận. Phân biệt dữ kiện có nguồn với diễn giải; ghi tên tài liệu hoặc đường dẫn cho các nhận định có căn cứ. Không bịa số liệu, trích dẫn hay trải nghiệm cá nhân. Ghi thông tin còn thiếu vào mục “Cần xác minh” cuối bài. Loại bỏ nội dung lặp và lời quảng cáo sáo rỗng, rồi rà soát theo yêu cầu xuất bản.` },
      fr: { tags: ['article', 'consignes', 'sources'], title: 'Transformer un brief en article étayé', description: 'Un angle clair, des exemples utiles et un texte dont les faits sont vérifiables.', body: `Sujet : {{sujet}}
Public et action attendue : {{public et objectif}}
Documents de référence : {{sources}}
Support, longueur et ton : {{consignes éditoriales}}

Propose trois titres, un plan court, puis un article complet. Commence par l'intérêt du sujet pour le public et appuie l'argumentation sur des exemples concrets. Distingue les faits documentés des interprétations ; indique les sources ou liens des affirmations étayées. N'invente ni chiffres, ni citations, ni expériences personnelles. Regroupe les informations manquantes sous « À vérifier » après le texte. Supprime les répétitions et les formules publicitaires creuses, puis vérifie le respect des consignes éditoriales.` },
      es: { tags: ['artículo', 'encargo', 'fuentes'], title: 'Del encargo a un artículo con fundamento', description: 'Un argumento claro, ejemplos útiles y un borrador verificable.', body: `Tema: {{tema}}
Lectores y acción esperada: {{público y objetivo}}
Material de referencia: {{fuentes}}
Canal, extensión y tono: {{requisitos editoriales}}

Entrega tres opciones de título, un esquema breve y el artículo completo. Empieza por el valor para el lector y apoya los argumentos con ejemplos concretos. Distingue hechos documentados de interpretaciones e indica las fuentes o enlaces de las afirmaciones respaldadas. No inventes estadísticas, citas ni experiencias personales. Reúne la información pendiente en «Por verificar» al final. Elimina repeticiones y frases publicitarias vacías, y comprueba que el texto cumple los requisitos editoriales.` },
      ko: { tags: ['글쓰기', '작성 요건', '출처'], title: '자료에서 완성 원고까지', description: '읽을 이유가 분명하고, 근거를 확인할 수 있는 글을 만듭니다.', body: `주제: {{주제}}
독자와 읽은 뒤 기대하는 행동: {{독자와 목적}}
활용할 자료: {{참고 자료}}
게시 채널·분량·문체: {{작성 조건}}

제목 후보 3개, 짧은 개요, 완성 원고 순서로 작성해 주세요. 도입에서 독자에게 필요한 이유를 밝히고 구체적인 예시로 주장을 뒷받침하세요. 자료에 있는 사실과 해석을 구분하고, 근거가 있는 주장에는 자료명이나 링크를 붙이세요. 통계·인용·개인 경험을 지어내지 말고, 부족한 정보는 원고 끝의 ‘확인 필요’에 모으세요. 중복과 공허한 홍보 문구를 덜어내고 작성 조건에 맞춰 마무리하세요.` }
    }
  },
  {
    id: 'localization-editor', category: 'writing', icon: 'languages', tags: ['translation', 'localization', 'editing'],
    translations: {
      ja: { tags: ['翻訳', 'ローカライズ', '編集'], title: '伝わる翻訳とローカライズ', description: '意味を守りながら、地域・読者・媒体に合う言葉へ。', body: `原文：{{原文}}
対象言語・地域：{{対象言語と地域}}
読者・使用場面：{{読者と用途}}
用語・文体・文字数のルール：{{表記ルール}}

そのまま使える訳文を最初に提示してください。意図と事実関係を保ち、慣用表現、日付、単位、呼びかけ方を対象地域に合わせてください。数値、固有名詞、URL、コード、テンプレート変数は指定がない限り保持してください。直訳から大きく変えた箇所のみ短く説明し、意味が曖昧な箇所は候補と確認事項を示してください。最後に用語の統一、訳抜け、文字数条件を点検してください。` },
      zh: { tags: ['翻译', '本地化', '编辑'], title: '自然准确的翻译与本地化', description: '保留原意，让措辞适合目标地区、读者和使用场景。', body: `原文：{{原文}}
目标语言及地区：{{目标语言与地区}}
读者与使用场景：{{读者与用途}}
术语、文风和字数规则：{{风格规范}}

先给出可直接使用的译文。保留原意和事实关系，按目标地区调整习惯表达、日期、单位及称谓。除非明确要求修改，否则保留数值、专有名词、网址、代码和模板变量。仅简要说明与直译差异较大的处理；遇到歧义时列出译法选项及待确认问题。最后检查术语一致性、有无漏译，以及是否符合字数限制。` },
      en: { tags: ['translation', 'localization', 'editing'], title: 'Translate for the people reading it', description: 'Preserve meaning while adapting language, conventions, and tone.', body: `Original text: {{original text}}
Target language and region: {{target locale}}
Readers and use case: {{audience and use}}
Terminology, style, and length rules: {{style guide}}

Start with a ready-to-use translation. Preserve intent and factual relationships while adapting idioms, dates, units, and forms of address to the target locale. Keep numbers, proper names, URLs, code, and template variables unchanged unless instructed otherwise. Briefly explain only substantial departures from literal wording. Where meaning is ambiguous, provide options and a clarification note. Finish by checking terminology consistency, omissions, and length requirements.` },
      vi: { tags: ['dịch thuật', 'bản địa hóa', 'biên tập'], title: 'Dịch đúng ý, phù hợp người đọc', description: 'Giữ nguyên ý nghĩa, điều chỉnh cách diễn đạt theo vùng và ngữ cảnh.', body: `Văn bản gốc: {{văn bản gốc}}
Ngôn ngữ và khu vực đích: {{ngôn ngữ và khu vực}}
Độc giả và mục đích sử dụng: {{độc giả và mục đích}}
Quy tắc về thuật ngữ, văn phong và độ dài: {{hướng dẫn văn phong}}

Đưa bản dịch dùng được ngay lên đầu. Giữ nguyên ý định và quan hệ giữa các dữ kiện, đồng thời điều chỉnh thành ngữ, ngày tháng, đơn vị và cách xưng hô cho phù hợp. Giữ nguyên số liệu, tên riêng, URL, mã và biến mẫu nếu không có yêu cầu khác. Chỉ giải thích ngắn những chỗ chuyển ý đáng kể so với bản dịch sát chữ. Với chỗ mơ hồ, đưa ra phương án và điều cần xác nhận. Cuối cùng, kiểm tra thuật ngữ, nội dung bỏ sót và giới hạn độ dài.` },
      fr: { tags: ['traduction', 'localisation', 'révision'], title: 'Traduire pour le public visé', description: 'Préserver le sens tout en adaptant la langue, les usages et le ton.', body: `Texte original : {{texte original}}
Langue et région cibles : {{langue et région}}
Public et usage : {{public et usage}}
Règles de terminologie, de style et de longueur : {{guide de style}}

Présente d'abord une traduction prête à l'emploi. Préserve l'intention et les faits en adaptant les expressions, dates, unités et formules d'adresse aux usages locaux. Conserve les nombres, noms propres, URL, code et variables de modèle sauf instruction contraire. Explique brièvement les seuls écarts importants par rapport au sens littéral. En cas d'ambiguïté, propose des options et précise ce qui reste à confirmer. Vérifie enfin la cohérence terminologique, l'absence d'omissions et la longueur demandée.` },
      es: { tags: ['traducción', 'localización', 'edición'], title: 'Traducir para quienes van a leer', description: 'Conserva el sentido y adapta el lenguaje, las convenciones y el tono.', body: `Texto original: {{texto original}}
Idioma y región de destino: {{idioma y región}}
Público y uso: {{público y uso}}
Reglas de terminología, estilo y extensión: {{guía de estilo}}

Presenta primero una traducción lista para usar. Conserva la intención y los hechos, adaptando modismos, fechas, unidades y formas de tratamiento al contexto local. Mantén números, nombres propios, URL, código y variables de plantilla salvo indicación contraria. Explica brevemente solo los cambios importantes respecto a una traducción literal. Si hay ambigüedad, ofrece alternativas y señala qué falta confirmar. Revisa al final la coherencia terminológica, las omisiones y los límites de extensión.` },
      ko: { tags: ['번역', '현지화', '편집'], title: '독자에게 자연스럽게 닿는 번역', description: '원문의 뜻을 지키고 지역·독자·매체에 맞게 표현을 다듬습니다.', body: `원문: {{원문}}
대상 언어와 지역: {{대상 언어와 지역}}
독자와 사용 상황: {{독자와 용도}}
용어·문체·글자 수 규칙: {{스타일 가이드}}

바로 사용할 수 있는 번역문을 먼저 제시하세요. 의도와 사실관계는 유지하고 관용 표현, 날짜, 단위, 호칭을 대상 지역에 맞추세요. 별도 지시가 없으면 숫자·고유명사·URL·코드·템플릿 변수는 유지하세요. 직역에서 크게 달라진 부분만 간단히 설명하고, 의미가 모호한 곳은 번역 후보와 확인할 사항을 제시하세요. 마지막으로 용어 일관성, 누락, 글자 수 조건을 점검하세요.` }
    }
  },
  {
    id: 'evidence-research', category: 'research', icon: 'search', tags: ['research', 'evidence', 'sources'],
    translations: {
      ja: { tags: ['調査', '根拠', '出典'], title: '根拠をたどれる調査ブリーフ', description: '確認できたこと、対立する証拠、未解決の点を分けて整理。', body: `調べたい問い：{{調査の問い}}
背景・範囲・対象期間：{{調査範囲}}
利用可能な資料やリンク：{{資料}}
必要な成果物と分量：{{成果物}}

問いへの暫定的な答えを先に示し、主要な論点を根拠付きでまとめてください。検索が利用できる場合は一次資料を優先し、公開日と出来事の日付を区別してください。利用できない場合は渡された資料の範囲を明記してください。重要な主張ごとに出典・日付・限界を示し、反証や資料間の不一致も扱ってください。未確認のURLや引用を作らず、最後に「判明したこと／まだ不明なこと／次に確認すること」を整理してください。` },
      zh: { tags: ['研究', '证据', '来源'], title: '有据可查的研究简报', description: '把已证实的发现、相反证据与尚未解决的问题分开呈现。', body: `研究问题：{{研究问题}}
背景、范围及时间区间：{{研究范围}}
可用资料或链接：{{资料}}
所需成果与篇幅：{{交付要求}}

先给出对问题的初步结论，再用证据展开主要论点。如果可以检索，优先采用一手资料，并区分发布日期与事件发生日期；如果无法检索，请明确仅依据所提供的资料。重要论断应附来源、日期和局限，也要呈现反证及资料之间的矛盾。不要编造未核实的网址或引文。最后列出“已经知道什么／仍然不知道什么／下一步核查什么”。` },
      en: { tags: ['research', 'evidence', 'sources'], title: 'Research with an evidence trail', description: 'Separate supported findings, conflicting evidence, and open questions.', body: `Research question: {{research question}}
Background, scope, and time period: {{scope}}
Available materials or links: {{sources}}
Required deliverable and length: {{deliverable}}

Lead with a provisional answer, then develop the main findings with evidence. If search is available, prioritize primary sources and distinguish publication dates from event dates. Otherwise, state that the research is limited to the supplied material. Give a source, date, and limitation for important claims, including counterevidence and disagreements between sources. Never invent unverified URLs or quotations. End with what is established, what remains unknown, and the next checks that would most improve the answer.` },
      vi: { tags: ['nghiên cứu', 'bằng chứng', 'nguồn tài liệu'], title: 'Nghiên cứu có nguồn để đối chiếu', description: 'Tách rõ phát hiện có căn cứ, bằng chứng trái chiều và câu hỏi còn mở.', body: `Câu hỏi nghiên cứu: {{câu hỏi nghiên cứu}}
Bối cảnh, phạm vi và giai đoạn: {{phạm vi}}
Tài liệu hoặc đường dẫn hiện có: {{nguồn tài liệu}}
Sản phẩm cần bàn giao và độ dài: {{yêu cầu đầu ra}}

Mở đầu bằng câu trả lời sơ bộ, sau đó trình bày các phát hiện chính kèm bằng chứng. Nếu có công cụ tìm kiếm, ưu tiên các nguồn sơ cấp và phân biệt ngày xuất bản với ngày sự kiện diễn ra. Nếu không, nêu rõ nghiên cứu chỉ dựa trên tài liệu được cung cấp. Với nhận định quan trọng, ghi nguồn, ngày và hạn chế; xem xét cả bằng chứng phản bác và điểm mâu thuẫn. Không bịa URL hay trích dẫn chưa xác minh. Kết thúc bằng điều đã biết, điều chưa biết và những bước kiểm chứng có giá trị nhất.` },
      fr: { tags: ['recherche', 'preuves', 'sources'], title: 'Une recherche aux preuves traçables', description: 'Distinguer les résultats étayés, les contradictions et les questions ouvertes.', body: `Question de recherche : {{question de recherche}}
Contexte, périmètre et période : {{périmètre}}
Documents ou liens disponibles : {{sources}}
Livrable et longueur souhaités : {{livrable}}

Commence par une réponse provisoire, puis développe les principaux résultats avec leurs preuves. Si la recherche en ligne est disponible, privilégie les sources primaires et distingue la date de publication de celle des faits. Sinon, précise que l'analyse se limite aux documents fournis. Associe aux affirmations importantes une source, une date et une limite ; traite aussi les contre-arguments et les contradictions. N'invente aucun lien ni aucune citation non vérifiés. Termine par les acquis, les inconnues et les vérifications les plus utiles à poursuivre.` },
      es: { tags: ['investigación', 'evidencias', 'fuentes'], title: 'Investigar con un rastro de evidencias', description: 'Distingue hallazgos respaldados, pruebas contradictorias y preguntas abiertas.', body: `Pregunta de investigación: {{pregunta de investigación}}
Contexto, alcance y periodo: {{alcance}}
Materiales o enlaces disponibles: {{fuentes}}
Entregable y extensión: {{entregable}}

Empieza con una respuesta provisional y desarrolla los hallazgos principales con pruebas. Si puedes buscar, prioriza fuentes primarias y distingue la fecha de publicación de la fecha de los hechos. Si no, aclara que el análisis se limita al material proporcionado. Añade fuente, fecha y limitaciones a las afirmaciones importantes, incluyendo pruebas contrarias y discrepancias entre fuentes. No inventes URL ni citas sin verificar. Termina con lo establecido, lo que sigue sin saberse y las comprobaciones que más mejorarían la respuesta.` },
      ko: { tags: ['조사', '근거', '출처'], title: '근거를 추적할 수 있는 리서치', description: '확인된 사실, 상충하는 근거, 남은 질문을 구분해 정리합니다.', body: `조사할 질문: {{조사 질문}}
배경·범위·대상 기간: {{조사 범위}}
이용 가능한 자료나 링크: {{참고 자료}}
필요한 결과물과 분량: {{결과물}}

질문에 대한 잠정 답변을 먼저 제시하고 핵심 발견을 근거와 함께 설명하세요. 검색을 사용할 수 있다면 1차 자료를 우선하고 발표일과 실제 사건 날짜를 구분하세요. 검색이 불가능하면 제공된 자료에 한정된 조사임을 밝히세요. 중요한 주장마다 출처·날짜·한계를 표시하고 반대 근거와 자료 간 불일치도 다루세요. 확인하지 않은 URL이나 인용문을 만들지 마세요. 마지막에 ‘알게 된 것 / 아직 모르는 것 / 다음에 확인할 것’을 정리하세요.` }
    }
  },
  {
    id: 'document-comparison', category: 'research', icon: 'files', tags: ['documents', 'comparison', 'retrieval'],
    translations: {
      ja: { tags: ['文書', '比較', '情報検索'], title: '複数の文書を根拠付きで比較', description: '文書を横断し、合意点・差分・矛盾を引用箇所まで追跡。', body: `文書と識別名：{{文書}}
答えたい問い：{{比較の問い}}
比較項目：{{比較軸}}
出力形式・分量：{{出力条件}}

提供された文書だけを根拠に比較してください。まず参照できた文書と欠けている文書を示し、比較表、主要な一致点と相違点、問いへの回答を作成してください。各判断には文書名とページ・節・短い引用のいずれかを付けてください。「記載なし」と「否定している」を区別し、版や日付の違いも確認してください。外部知識で欠落を埋めず、文書間の矛盾や読み取れない箇所は未解決として明記してください。` },
      zh: { tags: ['文档', '对比', '信息检索'], title: '跨文档对比，结论有出处', description: '追踪共识、差异和冲突，定位到具体文档段落。', body: `文档及各自名称：{{文档}}
需要回答的问题：{{对比问题}}
比较维度：{{比较维度}}
输出格式与篇幅：{{输出要求}}

仅依据提供的文档进行比较。先列出可以读取和缺失的文档，再交付对比表、主要共识与差异，以及对问题的回答。每项判断标注文档名，并附页码、章节或简短引文中的至少一项。区分“未提及”与“明确否定”，检查版本和日期差异。不要用外部知识填补空白；对于文档冲突或无法读取的内容，明确标记为尚未解决。` },
      en: { tags: ['documents', 'comparison', 'retrieval'], title: 'Compare documents with traceable answers', description: 'Find agreement, differences, and contradictions across your source set.', body: `Documents and their labels: {{documents}}
Question to answer: {{comparison question}}
Comparison dimensions: {{criteria}}
Output format and length: {{output requirements}}

Use only the supplied documents. First list which documents you could access and which are missing. Deliver a comparison table, the main agreements and differences, and an answer to the question. Anchor each finding to a document name plus a page, section, or short quotation. Distinguish “not mentioned” from “explicitly ruled out” and check version or date differences. Do not fill gaps with outside knowledge; mark unresolved contradictions and unreadable passages explicitly.` },
      vi: { tags: ['tài liệu', 'so sánh', 'truy xuất'], title: 'Đối chiếu tài liệu, truy được căn cứ', description: 'Tìm điểm thống nhất, khác biệt và mâu thuẫn giữa nhiều tài liệu.', body: `Tài liệu và tên nhận diện: {{tài liệu}}
Câu hỏi cần trả lời: {{câu hỏi đối chiếu}}
Các tiêu chí so sánh: {{tiêu chí}}
Định dạng và độ dài đầu ra: {{yêu cầu đầu ra}}

Chỉ sử dụng các tài liệu được cung cấp. Trước hết, liệt kê tài liệu đọc được và tài liệu còn thiếu. Cung cấp bảng so sánh, các điểm thống nhất và khác biệt chính, rồi trả lời câu hỏi. Với mỗi kết luận, ghi tên tài liệu cùng số trang, mục hoặc trích dẫn ngắn. Phân biệt “không đề cập” với “bác bỏ rõ ràng”, đồng thời kiểm tra khác biệt về phiên bản và ngày. Không dùng kiến thức bên ngoài để lấp chỗ trống; đánh dấu rõ mâu thuẫn chưa giải quyết và đoạn không đọc được.` },
      fr: { tags: ['documents', 'comparaison', 'recherche documentaire'], title: 'Comparer des documents avec des réponses sourcées', description: 'Repérer accords, différences et contradictions dans un corpus.', body: `Documents et noms de référence : {{documents}}
Question à résoudre : {{question de comparaison}}
Axes de comparaison : {{critères}}
Format et longueur : {{consignes de sortie}}

Utilise uniquement les documents fournis. Indique d'abord ceux qui sont accessibles et ceux qui manquent. Fournis un tableau comparatif, les principaux accords et écarts, puis une réponse à la question. Rattache chaque constat à un document et à une page, une section ou une courte citation. Distingue « non mentionné » de « explicitement exclu » et vérifie les différences de version ou de date. Ne comble pas les lacunes avec des connaissances externes ; signale les contradictions non résolues et les passages illisibles.` },
      es: { tags: ['documentos', 'comparación', 'recuperación'], title: 'Comparar documentos con respuestas trazables', description: 'Encuentra acuerdos, diferencias y contradicciones en tus fuentes.', body: `Documentos y nombres de referencia: {{documentos}}
Pregunta que resolver: {{pregunta de comparación}}
Dimensiones de comparación: {{criterios}}
Formato y extensión: {{requisitos de salida}}

Usa únicamente los documentos proporcionados. Indica primero cuáles has podido consultar y cuáles faltan. Entrega una tabla comparativa, los principales acuerdos y diferencias, y una respuesta a la pregunta. Vincula cada hallazgo a un documento y una página, sección o cita breve. Distingue «no mencionado» de «descartado expresamente» y revisa las diferencias de versión o fecha. No rellenes lagunas con conocimiento externo; señala las contradicciones sin resolver y los fragmentos ilegibles.` },
      ko: { tags: ['문서', '비교', '정보 검색'], title: '여러 문서 비교와 근거 추적', description: '문서 사이의 합의점·차이·충돌을 원문 위치와 함께 확인합니다.', body: `문서와 각 문서의 이름: {{문서}}
답해야 할 질문: {{비교 질문}}
비교할 항목: {{비교 기준}}
출력 형식과 분량: {{출력 조건}}

제공한 문서만 근거로 비교하세요. 먼저 읽을 수 있었던 문서와 누락된 문서를 밝히고, 비교표·주요 합의점과 차이·질문에 대한 답을 작성하세요. 각 판단에 문서명과 페이지·절·짧은 인용 중 하나 이상을 붙이세요. ‘언급 없음’과 ‘명시적으로 부정함’을 구분하고 버전이나 날짜 차이도 확인하세요. 외부 지식으로 빈칸을 채우지 말고 문서 간 충돌이나 읽을 수 없는 부분은 미해결로 표시하세요.` }
    }
  },
  {
    id: 'decision-memo', category: 'work', icon: 'compass', tags: ['decision', 'tradeoffs', 'memo'],
    translations: {
      ja: { tags: ['意思決定', '利点と欠点', 'メモ'], title: '判断を前に進める意思決定メモ', description: '選択肢、代償、推奨案が変わる条件を1つのメモに。', body: `決めること：{{意思決定}}
背景と分かっている事実：{{背景}}
検討する選択肢：{{選択肢}}
期限・予算・譲れない条件：{{制約}}

意思決定者向けに簡潔なメモを作成してください。推奨案とその理由を先に示し、判断基準に沿って選択肢を比較してください。何もしない案も妥当なら含めてください。事実と仮定を分け、数値がない項目に架空の点数を付けないでください。主なリスク、取り消しや変更のしやすさ、推奨案が変わる条件を示してください。最後に、判断前に必要な確認と、決定後の最初の3つの行動を担当者・期限の未確定箇所も含めて整理してください。` },
      zh: { tags: ['决策', '取舍', '备忘录'], title: '让决策向前推进的备忘录', description: '一次说清选项、取舍，以及什么情况下应改变建议。', body: `需要做出的决策：{{决策}}
背景与已知事实：{{背景}}
候选方案：{{选项}}
期限、预算及不可妥协的条件：{{约束}}

为决策者写一份简明备忘录。先给出推荐方案及理由，再按决策标准比较各选项；合理时加入“维持现状”。区分事实与假设，不要在没有数据时编造评分。说明主要风险、决策的可逆性，以及哪些新信息会改变建议。最后列出决策前需要核实的事项，以及决策后的前三项行动；负责人和期限未知时应标注待定。` },
      en: { tags: ['decision', 'tradeoffs', 'memo'], title: 'A decision memo that moves work forward', description: 'Make the options, tradeoffs, and conditions for changing course explicit.', body: `Decision to make: {{decision}}
Context and known facts: {{context}}
Options under consideration: {{options}}
Deadline, budget, and non-negotiables: {{constraints}}

Write a concise memo for the decision maker. Lead with a recommendation and its rationale, then compare the options against relevant decision criteria. Include doing nothing when appropriate. Separate facts from assumptions and do not fabricate scores where data is absent. Explain the main risks, reversibility, and what new information would change the recommendation. Close with checks needed before deciding and the first three actions after a decision, marking unknown owners and deadlines as unassigned.` },
      vi: { tags: ['quyết định', 'đánh đổi', 'ghi nhớ'], title: 'Bản ghi nhớ giúp chốt quyết định', description: 'Làm rõ lựa chọn, đánh đổi và điều kiện để đổi hướng.', body: `Quyết định cần đưa ra: {{quyết định}}
Bối cảnh và dữ kiện đã biết: {{bối cảnh}}
Các phương án đang cân nhắc: {{phương án}}
Thời hạn, ngân sách và điều kiện bắt buộc: {{ràng buộc}}

Viết bản ghi nhớ ngắn cho người ra quyết định. Đưa khuyến nghị và lý do lên đầu, rồi so sánh các phương án theo tiêu chí phù hợp. Bao gồm phương án giữ nguyên hiện trạng nếu hợp lý. Tách dữ kiện khỏi giả định, không tự đặt điểm số khi thiếu dữ liệu. Nêu rủi ro chính, khả năng đảo ngược quyết định và thông tin nào sẽ làm thay đổi khuyến nghị. Kết thúc bằng việc cần kiểm chứng trước khi chốt và ba hành động đầu tiên sau quyết định; ghi rõ người phụ trách và hạn chót chưa được xác định.` },
      fr: { tags: ['décision', 'compromis', 'note'], title: 'Une note pour faire avancer la décision', description: 'Clarifier les options, les compromis et les conditions d’un changement de cap.', body: `Décision à prendre : {{décision}}
Contexte et faits connus : {{contexte}}
Options envisagées : {{options}}
Échéance, budget et impératifs : {{contraintes}}

Rédige une note concise pour la personne qui décide. Commence par la recommandation et sa justification, puis compare les options selon les critères pertinents. Inclus le maintien de la situation actuelle si cela a du sens. Distingue faits et hypothèses ; n'invente pas de scores sans données. Présente les risques principaux, la réversibilité et les informations qui pourraient modifier la recommandation. Termine par les vérifications préalables et les trois premières actions à engager, en signalant les responsables et échéances encore à définir.` },
      es: { tags: ['decisión', 'concesiones', 'nota'], title: 'Una nota para avanzar en la decisión', description: 'Aclara opciones, concesiones y condiciones para cambiar de rumbo.', body: `Decisión que tomar: {{decisión}}
Contexto y hechos conocidos: {{contexto}}
Opciones en consideración: {{opciones}}
Plazo, presupuesto y condiciones indispensables: {{restricciones}}

Redacta una nota breve para quien debe decidir. Empieza con la recomendación y su fundamento, y compara las opciones con criterios pertinentes. Incluye mantener la situación actual cuando tenga sentido. Separa hechos de supuestos y no inventes puntuaciones si faltan datos. Explica los principales riesgos, la reversibilidad y qué información cambiaría la recomendación. Termina con las comprobaciones previas y las tres primeras acciones tras decidir, señalando los responsables y plazos aún pendientes.` },
      ko: { tags: ['의사결정', '득실 비교', '메모'], title: '결정을 앞으로 움직이는 메모', description: '선택지·트레이드오프·추천이 달라지는 조건을 분명하게 정리합니다.', body: `결정할 사항: {{의사결정}}
배경과 확인된 사실: {{배경}}
검토할 선택지: {{선택지}}
기한·예산·양보할 수 없는 조건: {{제약}}

의사결정권자에게 전달할 간결한 메모를 작성하세요. 추천안과 이유를 먼저 밝히고 적절한 판단 기준으로 선택지를 비교하세요. 합리적이라면 현상 유지도 포함하세요. 사실과 가정을 구분하고 데이터가 없는 항목에 임의 점수를 붙이지 마세요. 주요 위험, 결정을 되돌리기 쉬운 정도, 추천을 바꿀 새 정보를 설명하세요. 마지막에 결정 전 확인 사항과 결정 후 첫 행동 3개를 정리하고, 담당자나 기한이 정해지지 않았으면 미정으로 표시하세요.` }
    }
  },
  {
    id: 'meeting-to-actions', category: 'work', icon: 'list', tags: ['meeting', 'actions', 'handoff'],
    translations: {
      ja: { tags: ['会議', '行動項目', '引き継ぎ'], title: '会議メモを実行できるタスクへ', description: '決定事項と提案を分け、担当・期限・依存関係を見える形に。', body: `議事メモまたは文字起こし：{{会議記録}}
会議の目的と関係者：{{目的と関係者}}
共有先・出力形式：{{共有条件}}

記録から、短い要約、確定した決定事項、アクション一覧、未解決の質問を作成してください。アクションは「実施内容／担当／期限／依存事項／記録内の根拠」で整理してください。提案や検討中の話を決定扱いせず、担当者や期限を推測で補わないでください。相対的な日付は会議日が確認できる場合だけ変換してください。食い違いは明記し、最後に関係者へ確認するための短い共有文案を付けてください。送信は不要です。` },
      zh: { tags: ['会议', '行动项', '交接'], title: '把会议记录变成可执行任务', description: '区分决定与提议，整理责任人、截止时间和依赖事项。', body: `会议笔记或转录：{{会议记录}}
会议目标与参与者：{{目标与参与者}}
分享对象及输出格式：{{分享要求}}

根据记录生成简短摘要、已确定的决定、行动清单和待解决问题。行动清单按“事项／负责人／截止时间／依赖／记录依据”整理。不要把提议或讨论中的内容当作决定，也不要猜测负责人和期限。只有确认会议日期后，才能把相对日期换算为具体日期。明确列出矛盾，最后附一段供参与者确认的简短沟通草稿，无需发送。` },
      en: { tags: ['meeting', 'actions', 'handoff'], title: 'Turn meeting notes into owned actions', description: 'Separate decisions from suggestions and surface missing owners or dates.', body: `Meeting notes or transcript: {{meeting record}}
Meeting objective and participants: {{objective and participants}}
Sharing audience and output format: {{sharing requirements}}

Extract a short summary, confirmed decisions, an action list, and open questions. Format actions as task / owner / deadline / dependencies / supporting passage. Do not promote suggestions or ongoing discussion into decisions, and do not guess owners or dates. Convert relative dates only when the meeting date is known. Flag contradictions. End with a short follow-up draft asking participants to confirm unresolved details; do not send it.` },
      vi: { tags: ['cuộc họp', 'việc cần làm', 'bàn giao'], title: 'Biến biên bản họp thành việc cần làm', description: 'Tách quyết định khỏi đề xuất, làm rõ người phụ trách và thời hạn còn thiếu.', body: `Ghi chú hoặc bản chép lời cuộc họp: {{nội dung cuộc họp}}
Mục tiêu và người tham gia: {{mục tiêu và người tham gia}}
Người nhận và định dạng chia sẻ: {{yêu cầu chia sẻ}}

Trích xuất bản tóm tắt ngắn, quyết định đã chốt, danh sách hành động và câu hỏi còn mở. Trình bày hành động theo việc cần làm / người phụ trách / hạn chót / việc phụ thuộc / đoạn làm căn cứ. Không biến đề xuất hoặc thảo luận đang diễn ra thành quyết định; không đoán người phụ trách hay ngày. Chỉ đổi mốc thời gian tương đối khi biết ngày họp. Chỉ rõ các mâu thuẫn. Cuối cùng, soạn tin nhắn ngắn để người tham gia xác nhận chi tiết chưa rõ, nhưng không gửi.` },
      fr: { tags: ['réunion', 'actions', 'passation'], title: 'Transformer une réunion en actions attribuées', description: 'Distinguer décisions et propositions, repérer les responsabilités manquantes.', body: `Notes ou transcription : {{compte rendu}}
Objectif et participants : {{objectif et participants}}
Destinataires et format : {{consignes de partage}}

Extrais une synthèse courte, les décisions confirmées, une liste d'actions et les questions ouvertes. Présente chaque action avec tâche / responsable / échéance / dépendances / passage justificatif. Ne transforme pas une suggestion ou une discussion en cours en décision ; n'invente ni responsable ni date. Convertis les dates relatives uniquement si la date de réunion est connue. Signale les contradictions. Termine par un court brouillon de suivi demandant aux participants de confirmer les points non résolus, sans l'envoyer.` },
      es: { tags: ['reunión', 'acciones', 'traspaso'], title: 'De la reunión a las acciones asignadas', description: 'Separa decisiones de propuestas y detecta responsables o fechas pendientes.', body: `Notas o transcripción: {{registro de la reunión}}
Objetivo y participantes: {{objetivo y participantes}}
Destinatarios y formato: {{requisitos para compartir}}

Extrae un resumen breve, decisiones confirmadas, una lista de acciones y preguntas abiertas. Presenta cada acción con tarea / responsable / plazo / dependencias / fragmento de apoyo. No conviertas sugerencias o debates en decisiones ni adivines responsables o fechas. Convierte fechas relativas solo si conoces el día de la reunión. Señala contradicciones. Termina con un borrador breve para pedir a los participantes que confirmen los detalles pendientes, sin enviarlo.` },
      ko: { tags: ['회의', '실행 항목', '인수인계'], title: '회의 기록을 실행할 일로 정리', description: '결정과 제안을 구분하고 담당·기한·의존 관계를 드러냅니다.', body: `회의 메모 또는 녹취록: {{회의 기록}}
회의 목적과 참석자: {{목적과 참석자}}
공유 대상과 출력 형식: {{공유 조건}}

짧은 요약, 확정된 결정, 실행 항목, 열린 질문을 추출하세요. 실행 항목은 ‘할 일 / 담당자 / 기한 / 선행 조건 / 기록상 근거’로 정리하세요. 제안이나 논의 중인 사항을 결정으로 바꾸지 말고 담당자와 날짜를 추측하지 마세요. 상대 날짜는 회의 날짜를 확인할 수 있을 때만 변환하세요. 서로 모순되는 내용은 표시하세요. 끝에 미확정 사항을 참석자에게 확인받을 짧은 공유 문안을 작성하되 전송하지 마세요.` }
    }
  },
  {
    id: 'feature-implementation', category: 'coding', icon: 'code', tags: ['coding', 'feature', 'validation'],
    translations: {
      ja: { tags: ['プログラミング', '機能実装', '動作確認'], title: '仕様を、検証できる実装へ', description: '既存コードの流れを踏まえて、小さく実装し動作を確かめる。', body: `コードベースや関連ファイル：{{コードの文脈}}
実現したい動作と受け入れ条件：{{機能要件}}
制約・対象外・互換性：{{制約}}
実行環境と利用可能な検証方法：{{検証環境}}

まず関連コードと既存の設計・テストを確認し、必要な変更を短く説明してください。アクセスできる場合は最小限の一貫した変更を実装し、できない場合は適用可能な差分を提示してください。入力検証、失敗時の動作、互換性を扱い、要件に関係する検証を行ってください。既存の無関係な変更は保持してください。最後に変更内容、実施した検証と結果、未検証の事項を示してください。実行していないテストを成功扱いしないでください。` },
      zh: { tags: ['编程', '功能实现', '功能验证'], title: '把需求变成可验证的实现', description: '沿用现有代码结构，完成范围明确、能够验证的功能改动。', body: `代码库或相关文件：{{代码上下文}}
预期行为与验收条件：{{功能需求}}
约束、不包含的范围与兼容性要求：{{约束}}
运行环境与可用验证方式：{{验证环境}}

先检查相关代码、现有设计及测试，简述所需改动。如果能访问代码库，就实施最小且完整的修改；否则提供可应用的补丁。处理输入校验、失败行为和兼容性，并执行与需求相关的验证。保留与本次任务无关的现有修改。最后说明改动内容、实际执行的检查及结果，以及尚未验证的部分。不要把未运行的测试报告为通过。` },
      en: { tags: ['coding', 'feature', 'validation'], title: 'Implement a feature with a clear finish line', description: 'Follow the existing code, make a focused change, and verify the behavior.', body: `Repository context or relevant files: {{code context}}
Desired behavior and acceptance criteria: {{feature requirements}}
Constraints, exclusions, and compatibility: {{constraints}}
Runtime and available validation: {{validation environment}}

Inspect the relevant code, conventions, and tests first; briefly explain the necessary changes. If repository access is available, implement a minimal coherent change; otherwise provide an applicable patch. Cover input validation, failure behavior, and compatibility, then run checks relevant to the requirements. Preserve unrelated existing work. Finish with what changed, checks actually run and their results, and anything left unverified. Never report an unrun test as passing.` },
      vi: { tags: ['lập trình', 'tính năng', 'kiểm tra'], title: 'Triển khai tính năng với tiêu chí hoàn thành rõ', description: 'Bám sát mã hiện có, thay đổi đúng phạm vi và kiểm chứng hành vi.', body: `Bối cảnh kho mã hoặc các tệp liên quan: {{bối cảnh mã}}
Hành vi mong muốn và tiêu chí nghiệm thu: {{yêu cầu tính năng}}
Ràng buộc, phạm vi loại trừ và tương thích: {{ràng buộc}}
Môi trường chạy và cách kiểm chứng hiện có: {{môi trường kiểm chứng}}

Trước tiên, xem mã, quy ước và kiểm thử liên quan; giải thích ngắn các thay đổi cần thiết. Nếu truy cập được kho mã, thực hiện thay đổi tối thiểu nhưng nhất quán; nếu không, cung cấp bản vá có thể áp dụng. Xử lý kiểm tra đầu vào, hành vi khi lỗi và tương thích, rồi chạy các bước kiểm chứng phù hợp với yêu cầu. Giữ nguyên công việc có sẵn không liên quan. Cuối cùng, nêu thay đổi, kiểm tra thực sự đã chạy cùng kết quả, và phần chưa xác minh. Không báo kiểm thử chưa chạy là đã đạt.` },
      fr: { tags: ['programmation', 'fonctionnalité', 'validation'], title: 'Implémenter une fonctionnalité vérifiable', description: 'Respecter le code existant, cibler les changements et vérifier le comportement.', body: `Contexte du dépôt ou fichiers concernés : {{contexte du code}}
Comportement attendu et critères d'acceptation : {{exigences fonctionnelles}}
Contraintes, exclusions et compatibilité : {{contraintes}}
Environnement et validations disponibles : {{environnement de validation}}

Examine d'abord le code, les conventions et les tests pertinents ; résume les changements nécessaires. Si le dépôt est accessible, réalise une modification minimale et cohérente ; sinon, fournis un correctif applicable. Traite la validation des entrées, les échecs et la compatibilité, puis effectue les vérifications adaptées aux exigences. Préserve le travail existant sans rapport avec la demande. Termine par les changements, les vérifications réellement exécutées avec leurs résultats et les points non vérifiés. Ne déclare jamais réussi un test non exécuté.` },
      es: { tags: ['programación', 'funcionalidad', 'validación'], title: 'Implementar una función con un final verificable', description: 'Respeta el código existente, acota el cambio y comprueba el comportamiento.', body: `Contexto del repositorio o archivos relevantes: {{contexto del código}}
Comportamiento esperado y criterios de aceptación: {{requisitos funcionales}}
Restricciones, exclusiones y compatibilidad: {{restricciones}}
Entorno y validaciones disponibles: {{entorno de validación}}

Revisa primero el código, las convenciones y las pruebas relevantes; explica brevemente los cambios necesarios. Si puedes acceder al repositorio, implementa un cambio mínimo y coherente; si no, entrega un parche aplicable. Atiende la validación de entradas, el comportamiento ante fallos y la compatibilidad, y ejecuta comprobaciones relacionadas con los requisitos. Conserva el trabajo ajeno al encargo. Termina con los cambios, las verificaciones realmente ejecutadas y sus resultados, y lo que quede sin verificar. Nunca declares aprobada una prueba que no has ejecutado.` },
      ko: { tags: ['코딩', '기능 구현', '동작 검증'], title: '완료 기준이 명확한 기능 구현', description: '기존 코드의 흐름을 따라 필요한 변경을 하고 동작을 확인합니다.', body: `저장소 맥락 또는 관련 파일: {{코드 맥락}}
원하는 동작과 수용 조건: {{기능 요구사항}}
제약·제외 범위·호환성: {{제약}}
실행 환경과 가능한 검증: {{검증 환경}}

먼저 관련 코드·규칙·테스트를 확인하고 필요한 변경을 짧게 설명하세요. 저장소에 접근할 수 있으면 최소한의 일관된 변경을 구현하고, 접근할 수 없으면 적용 가능한 패치를 제시하세요. 입력 검증, 실패 시 동작, 호환성을 다루고 요구사항과 관련된 검증을 수행하세요. 기존의 무관한 작업은 보존하세요. 마지막에 변경 내용, 실제 수행한 검사와 결과, 검증하지 못한 부분을 설명하세요. 실행하지 않은 테스트를 통과했다고 보고하지 마세요.` }
    }
  },
  {
    id: 'evidence-code-review', category: 'coding', icon: 'shield', tags: ['review', 'bugs', 'regression'],
    translations: {
      ja: { tags: ['コードレビュー', '不具合', '回帰不具合'], title: '再現条件が分かるコードレビュー', description: '好みの指摘を減らし、実際の不具合と影響を明確に。', body: `差分またはレビュー対象コード：{{コード}}
関連する呼び出し元・構成・テスト：{{周辺情報}}
期待する動作：{{期待する動作}}
レビューの対象範囲：{{レビュー範囲}}

正確性、セキュリティ、データ整合性、回帰に関わる実行可能な指摘を優先してください。各指摘は重要度、確認できるファイルと行、発生条件、具体的な影響、修正案を簡潔に示してください。提示されていない行番号や実行結果は作らないでください。周辺コードで防げている問題は指摘から除き、確証が足りないものは質問として分けてください。重大な指摘がなければその旨を明記し、残る検証不足を示してください。依頼がない限りコードは変更しないでください。` },
      zh: { tags: ['代码审查', '缺陷', '回归缺陷'], title: '能说明触发条件的代码审查', description: '聚焦真实缺陷与影响，减少个人风格偏好的干扰。', body: `变更差异或待审查代码：{{代码}}
相关调用方、配置与测试：{{上下文}}
预期行为：{{预期行为}}
审查范围：{{审查范围}}

优先报告涉及正确性、安全性、数据一致性和回归的可操作问题。每条问题简要给出严重程度、可核实的文件与行号、触发条件、具体影响和修复建议。不要编造未提供的行号或执行结果。排除已由周边代码防止的问题；证据不足的疑点单独列为问题。若没有重要发现，请明确说明，并指出剩余验证缺口。除非另有要求，不修改代码。` },
      en: { tags: ['review', 'bugs', 'regression'], title: 'Review code with concrete failure cases', description: 'Focus on real defects, their triggers, and the impact that matters.', body: `Diff or code to review: {{code}}
Related callers, configuration, and tests: {{context}}
Expected behavior: {{expected behavior}}
Review scope: {{review scope}}

Prioritize actionable correctness, security, data integrity, and regression findings. For each, give severity, a verifiable file and line reference, triggering conditions, concrete impact, and a concise fix direction. Do not invent unavailable line numbers or execution results. Exclude issues already prevented by surrounding code; separate uncertain concerns into questions. If no significant findings are supported, say so and identify remaining validation gaps. Do not modify the code unless asked.` },
      vi: { tags: ['rà soát mã', 'lỗi', 'lỗi hồi quy'], title: 'Rà soát mã bằng tình huống lỗi cụ thể', description: 'Tập trung vào lỗi thực, điều kiện phát sinh và tác động đáng kể.', body: `Bản diff hoặc mã cần rà soát: {{mã}}
Nơi gọi, cấu hình và kiểm thử liên quan: {{bối cảnh}}
Hành vi mong muốn: {{hành vi mong muốn}}
Phạm vi rà soát: {{phạm vi rà soát}}

Ưu tiên vấn đề có thể xử lý về tính đúng đắn, bảo mật, toàn vẹn dữ liệu và lỗi hồi quy. Với mỗi vấn đề, nêu mức độ, tệp và dòng có thể kiểm chứng, điều kiện phát sinh, tác động cụ thể và hướng sửa ngắn gọn. Không bịa số dòng không có hoặc kết quả thực thi. Loại bỏ vấn đề đã được mã xung quanh ngăn chặn; tách nghi vấn thiếu căn cứ thành câu hỏi. Nếu không có phát hiện đáng kể đủ cơ sở, nói rõ và nêu khoảng trống kiểm chứng còn lại. Không sửa mã khi chưa được yêu cầu.` },
      fr: { tags: ['revue de code', 'anomalies', 'régression'], title: 'Relire le code à partir de cas de panne concrets', description: 'Cibler les défauts réels, leurs déclencheurs et leurs conséquences.', body: `Diff ou code à examiner : {{code}}
Appels, configuration et tests associés : {{contexte}}
Comportement attendu : {{comportement attendu}}
Périmètre de la revue : {{périmètre de revue}}

Privilégie les problèmes exploitables de justesse, de sécurité, d'intégrité des données et de régression. Pour chacun, indique la gravité, un fichier et une ligne vérifiables, les conditions de déclenchement, l'impact concret et une piste de correction concise. N'invente ni numéros de ligne ni résultats d'exécution. Écarte les problèmes déjà empêchés par le code environnant ; présente les doutes insuffisamment étayés comme des questions. Si aucun problème significatif n'est démontré, indique-le et précise les validations manquantes. Ne modifie pas le code sans demande.` },
      es: { tags: ['revisión de código', 'errores', 'regresión'], title: 'Revisar código con casos de fallo concretos', description: 'Céntrate en defectos reales, sus desencadenantes y sus consecuencias.', body: `Diff o código que revisar: {{código}}
Llamadas, configuración y pruebas relacionadas: {{contexto}}
Comportamiento esperado: {{comportamiento esperado}}
Alcance de la revisión: {{alcance de revisión}}

Prioriza problemas corregibles de funcionamiento, seguridad, integridad de datos y regresión. Para cada uno, indica gravedad, archivo y línea verificables, condiciones que lo provocan, impacto concreto y una orientación breve de solución. No inventes números de línea ni resultados de ejecución. Descarta problemas ya evitados por el código circundante; separa como preguntas las dudas sin pruebas suficientes. Si no hay hallazgos importantes respaldados, dilo e identifica las validaciones pendientes. No modifiques el código salvo que se te pida.` },
      ko: { tags: ['코드 검토', '오류', '회귀 오류'], title: '발생 조건이 보이는 코드 리뷰', description: '실제 결함과 영향에 집중하고 취향에 따른 지적을 줄입니다.', body: `변경 diff 또는 리뷰할 코드: {{코드}}
관련 호출부·설정·테스트: {{주변 맥락}}
기대하는 동작: {{기대 동작}}
리뷰 범위: {{리뷰 범위}}

정확성, 보안, 데이터 무결성, 회귀와 관련된 조치 가능한 문제를 우선하세요. 각 문제에 심각도, 확인 가능한 파일과 행, 발생 조건, 구체적인 영향, 간결한 수정 방향을 제시하세요. 제공되지 않은 행 번호나 실행 결과를 만들지 마세요. 주변 코드가 이미 방지하는 문제는 제외하고, 근거가 부족한 의심은 질문으로 분리하세요. 뒷받침되는 주요 문제가 없다면 명시하고 남은 검증 공백을 설명하세요. 별도 요청이 없으면 코드를 수정하지 마세요.` }
    }
  },
  {
    id: 'engineering-change-review', category: 'engineering', icon: 'settings', tags: ['engineering', 'change', 'verification'],
    translations: {
      ja: { tags: ['工学', '設計変更', '検証'], title: '設計変更の影響をレビュー', description: '変更が要求・インターフェース・検証計画に及ぼす影響を整理。', body: `現状の設計と使用条件：{{現状}}
変更案と目的：{{変更案}}
要求仕様・許容値・適用規格：{{要求事項}}
図面・計算・試験などの根拠：{{根拠資料}}

設計変更レビューのたたき台を作成してください。変更点と影響する部品・工程・インターフェースを整理し、要求ごとに根拠、適合状況、不足情報、必要な検証を表にしてください。単位、前提、境界条件を明示し、規格の版や条項を確認できない場合は未確認としてください。測定値や安全性の確証を作らないでください。故障につながる経路と検出方法を挙げ、最後に承認判断に必要な試験と専門担当者への確認事項を優先順で示してください。` },
      zh: { tags: ['工程', '设计变更', '验证'], title: '评审工程变更的影响', description: '追踪设计变更对需求、接口和验证计划的影响。', body: `现有设计与使用条件：{{现状}}
拟议变更及目的：{{变更方案}}
需求、容差及适用标准：{{要求}}
图纸、计算和试验等依据：{{证据资料}}

起草工程变更评审。梳理变更点及受影响的部件、工序和接口，按需求列出依据、符合情况、缺失信息和必要验证。明确单位、假设与边界条件；无法核实标准版本或条款时，标注未核实。不要编造测量值或安全保证。列出可能导致失效的路径及检测方式，最后按优先级给出批准决策所需的试验，以及需要专业负责人确认的事项。` },
      en: { tags: ['engineering', 'change', 'verification'], title: 'Review the impact of an engineering change', description: 'Trace a proposed change through requirements, interfaces, and verification.', body: `Current design and operating conditions: {{current state}}
Proposed change and purpose: {{change proposal}}
Requirements, tolerances, and applicable standards: {{requirements}}
Drawings, calculations, and test evidence: {{evidence}}

Draft an engineering change review. Identify affected components, processes, and interfaces. For each requirement, tabulate evidence, conformance status, missing information, and necessary verification. State units, assumptions, and boundary conditions; mark standard editions or clauses unverified when you cannot confirm them. Do not invent measurements or assurances of safety. Outline plausible failure paths and detection methods, then prioritize the tests and specialist confirmations needed for an approval decision.` },
      vi: { tags: ['kỹ thuật', 'thay đổi', 'xác minh'], title: 'Đánh giá tác động của thay đổi kỹ thuật', description: 'Theo dõi ảnh hưởng đến yêu cầu, giao diện và kế hoạch kiểm chứng.', body: `Thiết kế hiện tại và điều kiện vận hành: {{hiện trạng}}
Thay đổi đề xuất và mục đích: {{đề xuất thay đổi}}
Yêu cầu, dung sai và tiêu chuẩn áp dụng: {{yêu cầu}}
Bản vẽ, tính toán và kết quả thử nghiệm: {{tài liệu chứng minh}}

Soạn bản đánh giá thay đổi kỹ thuật. Xác định bộ phận, quy trình và giao diện bị ảnh hưởng. Với mỗi yêu cầu, lập bảng gồm bằng chứng, mức đáp ứng, thông tin thiếu và kiểm chứng cần làm. Nêu đơn vị, giả định và điều kiện biên; đánh dấu chưa xác minh nếu không kiểm tra được phiên bản hoặc điều khoản tiêu chuẩn. Không bịa số đo hay bảo đảm an toàn. Mô tả các chuỗi nguyên nhân có thể dẫn đến hỏng và cách phát hiện, rồi ưu tiên thử nghiệm cùng xác nhận chuyên môn cần có trước khi phê duyệt.` },
      fr: { tags: ['ingénierie', 'modification', 'vérification'], title: 'Évaluer l’impact d’une modification technique', description: 'Suivre les effets sur les exigences, les interfaces et la vérification.', body: `Conception actuelle et conditions d'utilisation : {{état actuel}}
Modification proposée et objectif : {{modification proposée}}
Exigences, tolérances et normes applicables : {{exigences}}
Plans, calculs et résultats d'essais : {{éléments de preuve}}

Prépare une revue de modification technique. Identifie les composants, procédés et interfaces touchés. Pour chaque exigence, présente les preuves, la conformité, les informations manquantes et les vérifications nécessaires. Explicite unités, hypothèses et conditions aux limites ; signale toute édition ou clause de norme non vérifiée. N'invente ni mesures ni garanties de sécurité. Décris les scénarios plausibles de défaillance et leurs moyens de détection, puis hiérarchise les essais et confirmations de spécialistes nécessaires à une décision d'approbation.` },
      es: { tags: ['ingeniería', 'cambio', 'verificación'], title: 'Evaluar el impacto de un cambio de ingeniería', description: 'Sigue sus efectos sobre requisitos, interfaces y verificación.', body: `Diseño actual y condiciones de funcionamiento: {{estado actual}}
Cambio propuesto y objetivo: {{propuesta de cambio}}
Requisitos, tolerancias y normas aplicables: {{requisitos}}
Planos, cálculos y resultados de ensayos: {{evidencias}}

Prepara una revisión del cambio de ingeniería. Identifica componentes, procesos e interfaces afectados. Para cada requisito, presenta evidencia, estado de conformidad, información faltante y verificación necesaria. Explicita unidades, supuestos y condiciones de contorno; marca como no verificada cualquier edición o cláusula normativa que no puedas confirmar. No inventes mediciones ni garantías de seguridad. Describe vías plausibles de fallo y formas de detectarlas, y prioriza los ensayos y confirmaciones de especialistas necesarios para decidir la aprobación.` },
      ko: { tags: ['엔지니어링', '설계 변경', '검증'], title: '설계 변경의 영향 검토', description: '변경이 요구사항·인터페이스·검증 계획에 미치는 영향을 추적합니다.', body: `현재 설계와 사용 조건: {{현재 상태}}
변경안과 목적: {{변경안}}
요구사항·허용오차·적용 규격: {{요구사항}}
도면·계산·시험 등 근거: {{근거 자료}}

설계 변경 검토 초안을 작성하세요. 영향받는 부품·공정·인터페이스를 정리하고, 요구사항마다 근거·충족 상태·부족한 정보·필요한 검증을 표로 제시하세요. 단위, 가정, 경계 조건을 밝히고 규격의 판본이나 조항을 확인할 수 없으면 미확인으로 표시하세요. 측정값이나 안전성 보장을 만들어내지 마세요. 가능한 고장 경로와 검출 방법을 설명하고, 마지막에 승인 판단에 필요한 시험과 전문 담당자 확인 사항을 우선순위로 정리하세요.` }
    }
  },
  {
    id: 'visual-evidence-inspection', category: 'engineering', icon: 'eye', tags: ['vision', 'inspection', 'evidence'],
    translations: {
      ja: { tags: ['画像理解', '点検', '根拠'], title: '画像から、言えることだけを確認', description: '観察・推測・判定不能を分ける、画像レビュー用の依頼文。', body: `確認したい点：{{確認目的}}
画像と識別名：{{画像}}
対象物・撮影条件・参照基準：{{文脈と基準}}
希望する報告形式：{{報告形式}}

実際に参照できる画像を確認し、見えない画像があれば先に伝えてください。各指摘を「直接見える事実／そこからの推測／画像だけでは判定できないこと」に分け、画像名と位置を示してください。解像度、遮蔽、照明による限界を扱い、尺度や仕様がなければ寸法や規格への適合を断定しないでください。架空の品質点数や欠陥確率は出さないでください。問題候補ごとに追加の撮影・測定・現物確認を提案し、確認できた内容だけを結論にまとめてください。` },
      zh: { tags: ['图像理解', '检查', '证据'], title: '图像检查，只报告看得见的依据', description: '明确区分观察、推断与无法仅凭图像判断的事项。', body: `需要检查的问题：{{检查目标}}
图像及各自名称：{{图像}}
对象、拍摄条件与参考标准：{{背景与标准}}
期望报告格式：{{报告格式}}

检查实际可以访问的图像，先说明是否有无法查看的图片。每项发现按“直接可见事实／由此推断／仅凭图像无法判断”分类，并标注图像名和位置。说明分辨率、遮挡和光照造成的限制；缺少尺度或规格时，不要断言尺寸或合规情况。不要编造质量分数或缺陷概率。对疑似问题提出补拍、测量或实物检查建议，结论只涵盖已确认的内容。` },
      en: { tags: ['vision', 'inspection', 'evidence'], title: 'Inspect visual evidence without overclaiming', description: 'Separate what is visible, what is inferred, and what needs a physical check.', body: `Inspection question: {{inspection goal}}
Images and their labels: {{images}}
Object, capture conditions, and reference criteria: {{context and criteria}}
Preferred report format: {{report format}}

Inspect the images you can actually access and identify any you cannot view. Classify each finding as directly visible, inferred, or not determinable from images alone; include the image label and location. Explain limits from resolution, occlusion, and lighting. Without scale or specifications, do not assert dimensions or compliance. Do not invent quality scores or defect probabilities. For suspected issues, propose additional views, measurements, or physical checks. Base the conclusion only on what was established.` },
      vi: { tags: ['phân tích hình ảnh', 'kiểm tra', 'bằng chứng'], title: 'Kiểm tra hình ảnh, chỉ kết luận theo bằng chứng', description: 'Tách điều nhìn thấy, điều suy đoán và điều cần kiểm tra thực tế.', body: `Vấn đề cần kiểm tra: {{mục tiêu kiểm tra}}
Hình ảnh và tên nhận diện: {{hình ảnh}}
Đối tượng, điều kiện chụp và tiêu chí tham chiếu: {{bối cảnh và tiêu chí}}
Định dạng báo cáo mong muốn: {{định dạng báo cáo}}

Kiểm tra những ảnh thực sự truy cập được và nêu ảnh nào không thể xem. Phân loại từng phát hiện thành quan sát trực tiếp, suy luận hoặc không thể xác định chỉ từ ảnh; ghi tên ảnh và vị trí. Nêu giới hạn do độ phân giải, che khuất và ánh sáng. Nếu thiếu thước tỷ lệ hoặc thông số, không khẳng định kích thước hay mức tuân thủ. Không tự tạo điểm chất lượng hoặc xác suất lỗi. Với dấu hiệu nghi vấn, đề xuất góc chụp bổ sung, phép đo hoặc kiểm tra thực tế. Chỉ kết luận từ điều đã xác nhận.` },
      fr: { tags: ['analyse visuelle', 'inspection', 'preuves'], title: 'Examiner des images sans surinterpréter', description: 'Séparer ce qui est visible, déduit ou à vérifier sur place.', body: `Question à examiner : {{objectif de l’inspection}}
Images et noms de référence : {{images}}
Objet, conditions de prise de vue et critères : {{contexte et critères}}
Format de rapport souhaité : {{format du rapport}}

Examine les images réellement accessibles et précise celles que tu ne peux pas voir. Classe chaque constat comme directement visible, déduit ou impossible à déterminer sur image seule ; indique le nom de l'image et la zone concernée. Explique les limites de résolution, d'occultation et d'éclairage. Sans échelle ou spécifications, n'affirme ni dimensions ni conformité. N'invente pas de note de qualité ou de probabilité de défaut. Pour les anomalies possibles, propose des vues supplémentaires, des mesures ou un contrôle physique. Limite la conclusion aux éléments établis.` },
      es: { tags: ['análisis visual', 'inspección', 'evidencias'], title: 'Inspeccionar imágenes sin afirmar de más', description: 'Separa lo visible, lo inferido y lo que requiere comprobación física.', body: `Pregunta de inspección: {{objetivo de inspección}}
Imágenes y nombres de referencia: {{imágenes}}
Objeto, condiciones de captura y criterios: {{contexto y criterios}}
Formato de informe deseado: {{formato del informe}}

Examina las imágenes a las que realmente puedas acceder e indica cuáles no puedes ver. Clasifica cada hallazgo como visible directamente, inferido o imposible de determinar solo con imágenes; incluye el nombre y la ubicación. Explica los límites de resolución, obstrucciones e iluminación. Sin escala o especificaciones, no afirmes dimensiones ni conformidad. No inventes puntuaciones de calidad ni probabilidades de defecto. Ante posibles problemas, propone otras vistas, mediciones o una inspección física. Basa la conclusión solo en lo establecido.` },
      ko: { tags: ['이미지 이해', '점검', '근거'], title: '이미지에서 확인할 수 있는 것만 점검', description: '관찰·추론·판정 불가를 나누는 시각 자료 검토 요청문입니다.', body: `확인할 문제: {{검사 목적}}
이미지와 각 이미지의 이름: {{이미지}}
대상·촬영 조건·참조 기준: {{맥락과 기준}}
원하는 보고 형식: {{보고 형식}}

실제로 접근 가능한 이미지를 살펴보고 볼 수 없는 이미지가 있으면 먼저 밝히세요. 각 발견을 ‘직접 보이는 사실 / 그로부터의 추론 / 이미지만으로 판단 불가’로 나누고 이미지명과 위치를 표시하세요. 해상도·가림·조명에 따른 한계를 설명하세요. 척도나 사양이 없으면 치수나 규격 충족을 단정하지 마세요. 임의의 품질 점수나 결함 확률을 만들지 마세요. 의심되는 문제마다 추가 촬영·측정·현물 확인을 제안하고, 확인된 내용만 결론에 담으세요.` }
    }
  },
  {
    id: 'creative-directions', category: 'creative', icon: 'sparkles', tags: ['creative', 'concept', 'brief'],
    translations: {
      ja: { tags: ['創作', 'コンセプト', '制作要件'], title: '違いのある3つのクリエイティブ案', description: '同じ案の言い換えではなく、狙いの異なる方向性を比較。', body: `商品・企画・伝えたいこと：{{企画}}
対象者とその悩み：{{対象者}}
必須要素・避ける表現・制作条件：{{制約}}
使用する媒体と必要な成果物：{{媒体と成果物}}

明確に異なる3つのクリエイティブの方向性を提案してください。それぞれに着想、中心メッセージ、短いコピー、ビジュアルの説明、具体的な使用例を付けてください。対象者とのつながりと制作上の難点も示してください。根拠のない商品効果や実績は加えないでください。方向性を比較して1案を推奨し、その案の制作ブリーフと、小さく試すための評価方法までまとめてください。` },
      zh: { tags: ['创作', '构思', '创作要求'], title: '三个真正不同的创意方向', description: '比较不同的创意策略，而不只是同一个点子的文字变体。', body: `产品、项目与核心信息：{{项目}}
目标受众及其困扰：{{受众}}
必备元素、禁用表达与制作条件：{{约束}}
使用渠道及所需成果：{{渠道与成果}}

提出三个明显不同的创意方向。每个方向包含核心洞察、中心信息、短文案、视觉说明和一个具体使用示例。解释它与受众的关联，以及制作上的难点。不要添加没有依据的产品功效或业绩。比较三个方向并推荐一个，进一步交付该方案的制作简报，以及小范围测试时的评估方法。` },
      en: { tags: ['creative', 'concept', 'brief'], title: 'Three creative directions with real differences', description: 'Explore distinct ideas, then turn the strongest one into a workable brief.', body: `Product, project, and message: {{project}}
Audience and their unmet need: {{audience}}
Must-haves, exclusions, and production limits: {{constraints}}
Channels and required assets: {{channels and assets}}

Propose three clearly different creative directions. For each, include the central insight, message, a short piece of copy, a visual description, and a concrete usage example. Explain the audience connection and the production challenge. Do not invent product benefits or performance claims. Compare the directions and recommend one, then develop its production brief and a practical way to evaluate a small test.` },
      vi: { tags: ['sáng tạo', 'ý tưởng', 'yêu cầu'], title: 'Ba hướng sáng tạo khác biệt thực sự', description: 'Khám phá các ý tưởng riêng biệt và biến hướng tốt nhất thành đề bài sản xuất.', body: `Sản phẩm, dự án và thông điệp: {{dự án}}
Đối tượng và nhu cầu chưa được đáp ứng: {{đối tượng}}
Yếu tố bắt buộc, điều cần tránh và giới hạn sản xuất: {{ràng buộc}}
Kênh sử dụng và sản phẩm cần làm: {{kênh và sản phẩm}}

Đề xuất ba hướng sáng tạo khác nhau rõ rệt. Mỗi hướng gồm góc nhìn cốt lõi, thông điệp, một đoạn nội dung ngắn, mô tả hình ảnh và ví dụ sử dụng cụ thể. Giải thích sự liên quan với đối tượng và khó khăn khi sản xuất. Không tự thêm công dụng sản phẩm hay tuyên bố thành tích thiếu căn cứ. So sánh và đề xuất một hướng, rồi phát triển đề bài sản xuất cùng cách đánh giá một thử nghiệm nhỏ.` },
      fr: { tags: ['création', 'concept', 'consignes'], title: 'Trois pistes créatives vraiment distinctes', description: 'Explorer des idées différentes, puis transformer la meilleure en brief réalisable.', body: `Produit, projet et message : {{projet}}
Public et besoin non satisfait : {{public}}
Éléments obligatoires, exclusions et limites de production : {{contraintes}}
Canaux et livrables attendus : {{canaux et livrables}}

Propose trois directions créatives nettement différentes. Pour chacune, présente l'observation fondatrice, le message central, un texte court, une description visuelle et un exemple d'utilisation concret. Explique le lien avec le public et la difficulté de production. N'invente ni bénéfices produit ni résultats. Compare les pistes et recommande-en une, puis développe son brief de production et une méthode pratique pour évaluer un essai à petite échelle.` },
      es: { tags: ['creatividad', 'concepto', 'encargo'], title: 'Tres direcciones creativas realmente distintas', description: 'Explora ideas diferentes y convierte la mejor en un encargo realizable.', body: `Producto, proyecto y mensaje: {{proyecto}}
Público y necesidad no resuelta: {{público}}
Elementos obligatorios, exclusiones y límites de producción: {{restricciones}}
Canales y piezas necesarias: {{canales y piezas}}

Propón tres direcciones creativas claramente diferentes. Para cada una, incluye la observación central, el mensaje, un texto breve, una descripción visual y un ejemplo concreto de uso. Explica la conexión con el público y la dificultad de producción. No inventes beneficios del producto ni resultados. Compara las direcciones, recomienda una y desarrolla su encargo de producción junto con una forma práctica de evaluar una prueba pequeña.` },
      ko: { tags: ['창작', '구상', '작성 요건'], title: '차이가 분명한 크리에이티브 3안', description: '문구만 바꾸는 대신 서로 다른 아이디어를 비교하고 구체화합니다.', body: `제품·프로젝트·전할 메시지: {{프로젝트}}
대상과 아직 해결되지 않은 필요: {{대상}}
필수 요소·금지 표현·제작 조건: {{제약}}
사용 채널과 필요한 제작물: {{채널과 제작물}}

서로 뚜렷하게 다른 크리에이티브 방향 3개를 제안하세요. 각 안에 핵심 착안점, 중심 메시지, 짧은 카피, 비주얼 설명, 구체적인 사용 예를 포함하세요. 대상과 연결되는 이유와 제작상 어려움도 밝히세요. 근거 없는 제품 효능이나 성과를 덧붙이지 마세요. 세 안을 비교해 하나를 추천하고, 추천안의 제작 브리프와 작게 시험했을 때 평가할 방법까지 정리하세요.` }
    }
  },
  {
    id: 'learning-through-projects', category: 'creative', icon: 'book', tags: ['learning', 'practice', 'plan'],
    translations: {
      ja: { tags: ['学習', '実践', '計画'], title: '成果物で確かめる学習プラン', description: '教材を並べるだけでなく、練習・成果物・振り返りまで設計。', body: `身につけたい技能：{{学習テーマ}}
現在の経験と苦手な点：{{現在地}}
使える期間・週の時間・予算：{{学習条件}}
最後に自力でできるようになりたいこと：{{到達目標}}

到達目標から逆算した実践中心の学習計画を作ってください。最初に短い診断課題を置き、週ごとに学ぶこと、練習、形に残る成果物、達成基準を示してください。復習とフィードバックの時間を確保し、つまずいた場合の調整方法を付けてください。資料は少数に絞り、存在を確認できない教材やリンクは作らないでください。最初の学習日に行う具体的な課題と、最終成果を自己評価するチェック項目で締めくくってください。` },
      zh: { tags: ['学习', '实践', '计划'], title: '用作品验证学习成果', description: '不只罗列教材，还安排练习、成果产出和复盘。', body: `想掌握的技能：{{学习主题}}
现有经验与薄弱点：{{当前水平}}
可用周期、每周时间与预算：{{学习条件}}
最终希望独立完成的任务：{{目标能力}}

从目标能力倒推一份以实践为主的学习计划。先安排一个简短诊断任务，再按周列出学习内容、练习、可交付成果和达标标准。预留复习与反馈时间，说明遇到困难时如何调整。精选少量资料，不要编造无法确认存在的课程、教材或链接。最后给出第一天可直接执行的任务，以及用于评估最终成果的自查清单。` },
      en: { tags: ['learning', 'practice', 'plan'], title: 'Learn a skill by making something', description: 'Build a plan around practice, tangible work, and useful feedback.', body: `Skill to learn: {{learning topic}}
Current experience and weak spots: {{starting point}}
Time span, weekly availability, and budget: {{learning constraints}}
What you want to do independently at the end: {{target outcome}}

Work backward from the target outcome to create a practice-led learning plan. Start with a short diagnostic task, then give weekly learning goals, exercises, tangible deliverables, and completion criteria. Reserve time for review and feedback, and explain how to adjust when progress stalls. Keep resources selective; do not invent courses, books, or links you cannot verify. Finish with a concrete first-session exercise and a checklist for evaluating the final work.` },
      vi: { tags: ['học tập', 'thực hành', 'kế hoạch'], title: 'Học kỹ năng bằng sản phẩm thực tế', description: 'Lập kế hoạch xoay quanh thực hành, sản phẩm cụ thể và phản hồi hữu ích.', body: `Kỹ năng muốn học: {{chủ đề học}}
Kinh nghiệm hiện tại và điểm yếu: {{điểm xuất phát}}
Thời gian tổng, số giờ mỗi tuần và ngân sách: {{điều kiện học}}
Việc muốn tự làm được khi kết thúc: {{mục tiêu đầu ra}}

Từ mục tiêu đầu ra, lập ngược kế hoạch học lấy thực hành làm trọng tâm. Bắt đầu bằng bài đánh giá ngắn, sau đó chia theo tuần với mục tiêu, bài tập, sản phẩm cụ thể và tiêu chí hoàn thành. Dành thời gian ôn tập, nhận phản hồi và nêu cách điều chỉnh khi tiến độ chững lại. Chọn ít tài liệu nhưng phù hợp; không bịa khóa học, sách hay đường dẫn chưa xác minh. Kết thúc bằng bài tập cụ thể cho buổi đầu và danh sách tự đánh giá sản phẩm cuối.` },
      fr: { tags: ['apprentissage', 'pratique', 'plan'], title: 'Apprendre une compétence en réalisant un projet', description: 'Organiser la pratique, les réalisations concrètes et les retours utiles.', body: `Compétence à acquérir : {{sujet d’apprentissage}}
Expérience actuelle et difficultés : {{point de départ}}
Durée, disponibilité hebdomadaire et budget : {{contraintes d’apprentissage}}
Tâche à accomplir seul à la fin : {{objectif final}}

Construis un parcours pratique à partir de l'objectif final. Commence par un court exercice de diagnostic, puis détaille chaque semaine les objectifs, exercices, livrables concrets et critères de réussite. Prévois du temps pour réviser et recevoir des retours ; explique comment ajuster le parcours si la progression ralentit. Sélectionne peu de ressources et n'invente aucun cours, livre ou lien non vérifiable. Termine par un exercice précis pour la première séance et une grille d'autoévaluation de la réalisation finale.` },
      es: { tags: ['aprendizaje', 'práctica', 'plan'], title: 'Aprender una habilidad creando algo', description: 'Organiza la práctica, las entregas concretas y la retroalimentación útil.', body: `Habilidad que aprender: {{tema de aprendizaje}}
Experiencia actual y dificultades: {{punto de partida}}
Duración, horas semanales y presupuesto: {{condiciones de aprendizaje}}
Tarea que quieres realizar sin ayuda al terminar: {{objetivo final}}

Diseña un plan práctico partiendo del objetivo final. Empieza con un ejercicio breve de diagnóstico y detalla por semana los objetivos, ejercicios, entregables concretos y criterios de logro. Reserva tiempo para repasar y recibir comentarios, y explica cómo ajustar el plan si el avance se estanca. Selecciona pocos recursos; no inventes cursos, libros ni enlaces que no puedas verificar. Termina con un ejercicio concreto para la primera sesión y una lista de autoevaluación del trabajo final.` },
      ko: { tags: ['학습', '실습', '계획'], title: '결과물로 확인하는 학습 계획', description: '교재 목록을 넘어 연습·작은 결과물·피드백까지 설계합니다.', body: `배우려는 기술: {{학습 주제}}
현재 경험과 약한 부분: {{출발점}}
전체 기간·주당 시간·예산: {{학습 조건}}
마지막에 혼자 할 수 있게 되고 싶은 일: {{도달 목표}}

도달 목표에서 역산해 실습 중심의 학습 계획을 만드세요. 짧은 진단 과제로 시작하고 주차별 학습 목표, 연습, 구체적인 결과물, 완료 기준을 제시하세요. 복습과 피드백 시간을 확보하고 진도가 막혔을 때 조정하는 방법도 설명하세요. 자료는 소수로 추려 제안하고 존재를 확인할 수 없는 강의·책·링크는 만들지 마세요. 첫 학습일에 바로 할 과제와 최종 결과물을 스스로 평가할 체크리스트로 마무리하세요.` }
    }
  }
];
