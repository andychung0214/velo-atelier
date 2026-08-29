const freezeOptions = (options) => Object.freeze(
  options.map((option) => Object.freeze(option)),
);

export const PART_CATALOG = Object.freeze({
  frame: Object.freeze({
    id: 'frame',
    name: '車架系統',
    eyebrow: 'FRAME / 01',
    category: '車架',
    description: '車架決定整車的幾何、剛性與騎乘姿勢，是所有零件的結構核心。競賽、空力與耐力幾何分別偏向敏捷、低風阻與長途舒適。',
    tip: '先依騎乘目標選幾何，再考慮塗裝與零件；外觀相近不代表尺寸或相容性相同。',
  }),
  topTube: Object.freeze({
    id: 'topTube',
    name: '上管',
    eyebrow: 'CHASSIS / 02',
    category: '車架',
    description: '上管連接頭管與座管，影響跨高、前伸量及車架扭轉剛性，也是車架文字最醒目的展示位置之一。',
    tip: '斜上管通常提供較大的跨高空間；水平上管則帶有經典競賽車輪廓。',
  }),
  downTube: Object.freeze({
    id: 'downTube',
    name: '下管',
    eyebrow: 'CHASSIS / 03',
    category: '車架',
    description: '下管連接頭管與五通，是承受踩踏與轉向負荷的重要結構。空力車常以寬扁截面降低迎風阻力。',
    tip: '粗大的下管不等於單純更重；碳纖維疊層與截面形狀才是剛性配置關鍵。',
  }),
  fork: Object.freeze({
    id: 'fork',
    name: '前叉',
    eyebrow: 'STEERING / 04',
    category: '操控',
    description: '前叉固定前輪並把路面回饋傳到車把。叉肩、偏移量與剛性會共同影響轉向速度與穩定度。',
    tip: '碟煞前叉需承受非對稱煞車力，不能只依外觀與 C 夾煞前叉互換。',
  }),
  wheelset: Object.freeze({
    id: 'wheelset',
    name: '輪組',
    eyebrow: 'ROTATION / 05',
    category: '輪組',
    description: '輪組影響加速、巡航、側風穩定與整車反應。低框輪輕快，刀輪重視空力，板輪則以封閉輪面追求高速效率。',
    tip: '深框與板輪在強側風下需要更穩定的控車能力；實際使用前應確認賽事與道路條件。',
  }),
  brake: Object.freeze({
    id: 'brake',
    name: '煞車系統',
    eyebrow: 'CONTROL / 06',
    category: '制動',
    description: '碟煞透過花鼓上的碟盤制動，濕地穩定且散熱佳；C 夾煞直接夾持輪框，結構簡潔、重量較低。',
    tip: '兩種系統牽涉車架、前叉、花鼓與輪框規格，不可只替換單一夾器。',
  }),
  drivetrain: Object.freeze({
    id: 'drivetrain',
    name: '變速系統',
    eyebrow: 'SHIFT / 07',
    category: '傳動',
    description: '傳動系統把踩踏力量經曲柄、鏈條與飛輪送到後輪。電子變速以馬達換檔，機械變速則由鋼索拉動變速器。',
    tip: '齒比範圍比段數更重要；爬坡需求應同時考慮大飛輪與曲柄齒數。',
  }),
  crankset: Object.freeze({
    id: 'crankset',
    name: '曲柄組',
    eyebrow: 'POWER / 08',
    category: '傳動',
    description: '曲柄組把雙腿力量轉為鏈條張力。曲柄長度、盤片齒數與剛性會影響踩踏節奏及齒比配置。',
    tip: '曲柄長度應配合腿長與騎姿；更長不一定能產生更高的有效輸出。',
  }),
  cassette: Object.freeze({
    id: 'cassette',
    name: '飛輪',
    eyebrow: 'RATIO / 09',
    category: '傳動',
    description: '飛輪提供多組後齒比，讓騎士在平路、逆風與爬坡時維持合適踏頻。齒片跨度越大，換檔級距通常也越明顯。',
    tip: '更換大齒飛輪前，需確認後變速器腿長、鏈條長度與系統容量。',
  }),
  cockpit: Object.freeze({
    id: 'cockpit',
    name: '座艙系統',
    eyebrow: 'POSITION / 10',
    category: '操控',
    description: '車把與龍頭決定手部位置、前伸量及轉向槓桿。一體式空力把整合線路，傳統彎把則較容易調整與維修。',
    tip: '先確認把寬、Reach 與 Drop，再選擇造型；不合身的座艙會快速累積肩頸負擔。',
  }),
  barTape: Object.freeze({
    id: 'barTape',
    name: '把手帶',
    eyebrow: 'TOUCH / 11',
    category: '接觸點',
    description: '把手帶提供止滑、吸震與汗水管理，也是最容易改變整車性格的色彩零件。厚度與表面材質會影響手感。',
    tip: '長途可選較厚且吸震的材質；潮濕環境則優先考慮濕抓力與易清潔表面。',
  }),
  saddle: Object.freeze({
    id: 'saddle',
    name: '座墊',
    eyebrow: 'CONTACT / 12',
    category: '接觸點',
    description: '座墊支撐坐骨並允許骨盆穩定轉動。寬度、弧度與中央減壓設計應配合個人骨盆及騎姿。',
    tip: '柔軟不等於適合長途；正確寬度、角度與座高通常比厚軟墊更重要。',
  }),
  seatpost: Object.freeze({
    id: 'seatpost',
    name: '座管',
    eyebrow: 'FIT / 13',
    category: '車架',
    description: '座管固定座墊並調整高度與後移量。截面、夾具與碳纖維彈性會影響空力、維修及垂直舒適度。',
    tip: '鎖固扭力必須依製造商規範；碳纖維座管過度鎖緊可能造成損傷。',
  }),
  bottleCage: Object.freeze({
    id: 'bottleCage',
    name: '水壺架',
    eyebrow: 'UTILITY / 14',
    category: '配件',
    description: '水壺架在低重量下固定補給水壺。開口方向、夾持力與安裝位置會影響騎乘中取放。',
    tip: '小尺寸車架可考慮側取式水壺架，避免水壺與上管空間互相干涉。',
  }),
});

export const OPTION_CATALOG = Object.freeze({
  frame: freezeOptions([
    { value: 'race', label: '競賽幾何', note: '低前端、反應敏捷' },
    { value: 'aero', label: '空力幾何', note: '寬扁管型、巡航優先' },
    { value: 'endurance', label: '耐力幾何', note: '較高頭管、長途穩定' },
  ]),
  brake: freezeOptions([
    { value: 'disc', label: '碟煞', note: '全氣候制動與散熱' },
    { value: 'caliper', label: 'C 夾煞', note: '輕量、簡潔、經典' },
  ]),
  wheel: freezeOptions([
    { value: 'shallow', label: '低框輪', note: '靈活、抗側風' },
    { value: 'deep', label: '刀輪', note: '高速巡航效率' },
    { value: 'disc', label: '板輪', note: '封閉輪面、計時取向' },
  ]),
  drivetrain: freezeOptions([
    { value: 'electronic', label: '電子變速', note: '精準、短行程操作' },
    { value: 'mechanical', label: '機械變速', note: '直接、易於維護' },
  ]),
  cockpit: freezeOptions([
    { value: 'integrated', label: '一體式空力把', note: '整合走線、低風阻' },
    { value: 'classic', label: '傳統彎把', note: '調整彈性與維修便利' },
  ]),
});

export const COLOR_TARGETS = freezeOptions([
  { key: 'frameColor', label: '車架主色', partId: 'frame' },
  { key: 'forkColor', label: '前叉', partId: 'fork' },
  { key: 'rimColor', label: '輪框', partId: 'wheelset' },
  { key: 'accentColor', label: '車架飾線', partId: 'topTube' },
  { key: 'tapeColor', label: '把手帶', partId: 'barTape' },
  { key: 'saddleColor', label: '座墊', partId: 'saddle' },
  { key: 'hardwareColor', label: '金屬零件', partId: 'drivetrain' },
  { key: 'textColor', label: '車架文字', partId: 'downTube' },
]);
