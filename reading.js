/* Dreamy Oracle Tarot — fortune narrative engine V1.1.0 (Thai, entertainment) */
(function (global) {
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function clip(s, n) {
    s = (s || '').replace(/\s+/g, ' ').trim();
    if (s.length <= n) return s;
    const cut = s.slice(0, n);
    const i = cut.lastIndexOf(' ');
    return (i > n * 0.5 ? cut.slice(0, i) : cut).replace(/[၊,.\s]+$/, '') + '…';
  }
  function nameOf(item) {
    const c = item.card;
    return item.reversed ? c.nameTh + ' (กลับหัว)' : c.nameTh;
  }
  function kwOf(item) {
    const c = item.card;
    return item.reversed ? (c.kwRev || c.kw) : c.kw;
  }
  function meaningOf(item) {
    return item.reversed ? item.card.reversed : item.card.upright;
  }
  function domain(card) {
    if (card.arcana === 'major') return 'life';
    return card.suit || 'life';
  }

  // Suit / arcana flavor for love · work · mood
  const FLAVOR = {
    life: {
      love: [
        'เรื่องหัวใจอาจกำลังอยู่ในจุดที่ต้องการความจริงใจและการยอมรับตัวเองมากขึ้น',
        'ความสัมพันธ์ในช่วงนี้เชื่อมกับบทเรียนชีวิตใหญ่ — ไม่ใช่แค่ความรู้สึกชั่วคราว',
        'หัวใจของคุณถูกเรียกให้โตขึ้นอีกขั้น ไม่ว่าจะอยู่คนเดียวหรือมีใครอยู่ข้างๆ'
      ],
      work: [
        'งานและการตัดสินใจสำคัญกำลังกดดันให้คุณจัดลำดับความสำคัญใหม่',
        'เส้นทางอาชีพหรือโปรเจกต์ตอนนี้ต้องการวิสัยทัศน์ที่ชัด ไม่ใช่แค่ทำตามเคย',
        'โอกาสในหน้าที่การงานจะเปิดถ้าคุณกล้ารับบทบาทที่ใหญ่ขึ้นอย่างมีสติ'
      ],
      mood: [
        'อารมณ์โดยรวมเข้มข้นและมีความหมาย — ตั้งใจฟังเสียงภายในจะช่วยได้มาก',
        'จิตใจกำลังผ่านช่วงเปลี่ยนผ่าน อย่าบังคับให้ตัวเอง “โอเค” เร็วเกินไป',
        'พลังงานภายในขึ้นๆ ลงๆ แต่มีแสงนำทางถ้าคุณไม่รีบสรุป'
      ]
    },
    cups: {
      love: [
        'ด้านความรักและความรู้สึกโดดเด่นชัด — หัวใจกำลังพูดดังกว่าเหตุผล',
        'ความสัมพันธ์หรือความปรารถนาใกล้ชิดต้องการการโอบรับอย่างอ่อนโยน',
        'เรื่องหัวใจอาจได้รับการเยียวยาหรือเปิดประตูใหม่ถ้าคุณกล้าเปิดใจ'
      ],
      work: [
        'ที่ทำงานหรือทีม ให้น้ำหนักกับความเข้าใจและความร่วมมือทางใจ ไม่ใช่แค่ตัวเลข',
        'งานสร้างสรรค์หรืองานบริการคนจะไหลลื่นกว่างานที่แห้งแล้งทางอารมณ์',
        'ระวังให้อารมณ์ส่วนตัวกระทบการตัดสินใจเรื่องงานมากเกินไป'
      ],
      mood: [
        'อารมณ์อ่อนไหวและซึมซับสิ่งรอบตัวง่าย ดูแลพื้นที่ใจของตัวเองไว้',
        'ความรู้สึกอาจท่วมท้นเป็นระลอก — หายใจช้าๆ แล้วค่อยตั้งชื่อความรู้สึกนั้น',
        'ความสงบจะกลับมาเมื่อคุณยอมให้ตัวเองรู้สึกโดยไม่ตัดสิน'
      ]
    },
    wands: {
      love: [
        'ความรักช่วงนี้อาจมีประกาย ความหลงใหล หรือต้องการแอ็กชันมากกว่าคำพูด',
        'เสน่ห์และความมั่นใจของคุณดึงดูดคนอื่น แต่ก็อย่าเร่งความสัมพันธ์เร็วเกิน',
        'ถ้าใจยังไฟไหม้กับใครสักคน — ใช้ไฟนั้นสร้าง ไม่ใช่เผา'
      ],
      work: [
        'งานต้องการพลังริเริ่ม ความกล้า และการลงมือ ไม่ใช่แค่วางแผนบนกระดาษ',
        'โปรเจกต์ใหม่หรือการแข่งขันอาจจุดไฟให้คุณแสดงศักยภาพ',
        'ระวังการหุนหันในหน้าที่การงาน — โฟกัสพลังไปที่เป้าหมายเดียวจะไปไกลกว่า'
      ],
      mood: [
        'พลังงานโดยรวมร้อนแรง กระตือรือร้น แต่ระวังไหม้หมดก่อนถึงเส้นชัย',
        'อารมณ์คึกคัก มีแรงขับ — หาช่องทางปล่อยพลังอย่างสร้างสรรค์',
        'ถ้าหงุดหงิดง่าย ลองขยับร่างกายหรือเริ่มสิ่งเล็กๆ ที่ทำให้รู้สึกคืบหน้า'
      ]
    },
    swords: {
      love: [
        'เรื่องหัวใจต้องการบทสนทนาที่ชัดเจน ความจริงอาจเจ็บแต่ช่วยเคลียร์ปม',
        'ความสัมพันธ์อาจมีม่านหมอกจากความเข้าใจผิด — พูดตรงด้วยความเมตตา',
        'อย่าให้ความคิดวนลูปทำร้ายความรักที่ยังมีอยู่'
      ],
      work: [
        'งานช่วงนี้เน้นวิเคราะห์ การตัดสินใจคมๆ และตัดสิ่งที่ไม่จำเป็นออก',
        'ความขัดแย้งทางความคิดหรือข่าวสารอาจเข้ามา — ใช้เหตุผลนำทาง',
        'แผนที่ชัดและการสื่อสารตรงไปตรงมาจะพาคุณผ่านความซับซ้อนได้'
      ],
      mood: [
        'จิตใจอาจวุ่นด้วยความคิด ความกังวล หรือการครุ่นคิดยามค่ำ',
        'อารมณ์คมและระแวดระวัง — พักสมองบ้างจะช่วยให้มองเห็นทางออก',
        'ความกระจ่างจะมาเมื่อคุณกล้าเผชิญความจริงที่เลี่ยงมานาน'
      ]
    },
    pentacles: {
      love: [
        'ความรักและความรู้สึกมั่นคงเชื่อมกับเรื่องบ้าน การดูแล และการสร้างอนาคตร่วมกัน',
        'ความสัมพันธ์ที่จับต้องได้ การให้เวลาและทรัพยากร มีน้ำหนักกว่าคำหวาน',
        'ดูแลหัวใจแบบเดียวกับที่คุณดูแลสิ่งของมีค่า — ช้าๆ แต่มั่นคง'
      ],
      work: [
        'งาน การเงิน หรือรากฐานระยะยาวเป็นประเด็นหลักของไพ่ชุดนี้',
        'ความขยัน ฝีมือ และความน่าเชื่อถือจะสะสมผลให้คุณเห็นชัดขึ้น',
        'จัดระเบียบทรัพยากรและอย่าแบกภาระเงินทองคนเดียวถ้าแบ่งเบาได้'
      ],
      mood: [
        'อารมณ์ต้องการความมั่นคง ความเรียบง่าย และความรู้สึก “เท้าแตะพื้น”',
        'ความกังวลเรื่องความมั่นคงอาจแอบมากดใจ — จัดของเล็กๆ ในชีวิตให้เป็นระเบียบจะช่วย',
        'ความสงบมาพร้อมกับการดูแลร่างกาย บ้าน และกิจวัตรประจำวัน'
      ]
    }
  };

  const OPEN_1 = [
    'ในห้องออราเคิลที่ม่านหมอกลอยเอื่อย… ไพ่ใบเดียวเปิดปากกระซิบ',
    'เงียบ… แล้วแสงจางๆ ก็วาดคำตอบลงบนไพ่ตรงหน้าคุณ',
    'สิ่งที่คุณถามไว้ในใจ ถูกสะท้อนกลับมาเป็นภาพบนไพ่ใบนี้',
    'ดวงดาวหลังม่านกำมะหยี่กระพริบ — สารจากไพ่กำลังก่อตัว…'
  ];
  const OPEN_3 = [
    'สามใบเรียงเป็นทางเดินในหมอก — อดีตกระซิบ ปัจจุบันหายใจ อนาคตโบกมือเรียก',
    'ห้องออราเคิลเปิดประตูเวลา… ให้อ่านสามใบเป็นนิยายเรื่องเดียว',
    'สายไหมแห่งโชคชะตาถักจากสิ่งที่แล้ว สู่จังหวะนี้ และเงาข้างหน้า',
    'หมอกแยกชั้นเป็นสามวาระ — ฟังให้จบก่อนจะสรุปเร็วเกินไป…'
  ];
  const ADVICE = [
    'คำแนะนำจากออราเคิล: ช้าลงหนึ่งจังหวะ แล้วเลือกทางที่หัวใจและเหตุผลพอจะจับมือกันได้',
    'คำแนะนำจากออราเคิล: ดูแลตัวเองก่อนจะเร่งพิสูจน์อะไรกับโลกภายนอก',
    'คำแนะนำจากออราเคิล: จดสิ่งที่ไพ่สะท้อนไว้ แล้วสังเกต 3 วันข้างหน้าโดยไม่ตัดสินตัวเอง',
    'คำแนะนำจากออราเคิล: เปิดใจรับสัญญาณเล็กๆ — คำพูด โอกาส หรือความเงียบที่เพิ่งเกิดขึ้น',
    'คำแนะนำจากออราเคิล: อย่าฝืนสถานการณ์ ใช้ความอ่อนโยนกับตัวเองเป็นเข็มทิศ'
  ];
  const LOVE_BRIDGE = [
    'ด้านความรัก',
    'เรื่องหัวใจ',
    'ในความสัมพันธ์'
  ];
  const WORK_BRIDGE = [
    'ด้านงานและการเงิน',
    'ในหน้าที่การงาน',
    'เรื่องเป้าหมายและการลงมือ'
  ];
  const MOOD_BRIDGE = [
    'ด้านอารมณ์และพลังงาน',
    'ในใจตอนนี้',
    'เรื่องความรู้สึกภายใน'
  ];

  function flavorFor(item, aspect) {
    const d = domain(item.card);
    const bank = (FLAVOR[d] || FLAVOR.life)[aspect];
    return pick(bank);
  }

  function weaveSnippet(item) {
    // Soften dictionary tone: take a short essence, not full glossary
    return clip(meaningOf(item), 70);
  }

  function sentenceLove(item) {
    return pick(LOVE_BRIDGE) + ' — ' + flavorFor(item, 'love') +
      (Math.random() < 0.55 ? ' สัญญาณจากไพ่' + nameOf(item) + 'ชี้ว่า“' + kwOf(item) + '”' : '') + '.';
  }
  function sentenceWork(item) {
    return pick(WORK_BRIDGE) + ' — ' + flavorFor(item, 'work') + '.';
  }
  function sentenceMood(item) {
    return pick(MOOD_BRIDGE) + ' — ' + flavorFor(item, 'mood') +
      ' (' + weaveSnippet(item) + ')';
  }

  function fortuneOne(item) {
    const parts = [];
    parts.push(pick(OPEN_1));
    parts.push(
      'ไพ่ **' + nameOf(item) + '** สื่อคำหลักว่า “' + kwOf(item) + '” — ' +
      (item.reversed
        ? 'พลังงานถูกกักหรือกลับทิศ ต้องการการปรับมุมมองก่อนจะเดินต่อ.'
        : 'พลังงานไหลไปข้างหน้า เปิดทางให้คุณรับและลงมืออย่างมั่นใจ.')
    );
    const order = shuffleAspects();
    parts.push(aspectSentence(item, order[0]));
    parts.push(aspectSentence(item, order[1]));
    if (Math.random() < 0.8) parts.push(aspectSentence(item, order[2]));
    parts.push(pick(ADVICE));
    return parts.join(' ');
  }

  function aspectSentence(item, aspect) {
    if (aspect === 'love') {
      return pick(LOVE_BRIDGE) + ' — ' + flavorFor(item, 'love') +
        (Math.random() < 0.5 ? ' คำหลัก “' + kwOf(item) + '” กำลังสะท้อนตรงนี้.' : '.');
    }
    if (aspect === 'work') {
      return pick(WORK_BRIDGE) + ' — ' + flavorFor(item, 'work') + '.';
    }
    return pick(MOOD_BRIDGE) + ' — ' + flavorFor(item, 'mood') +
      ' ไพ่กระซิบบรรยากาศว่า ' + weaveSnippet(item);
  }

  function shuffleAspects() {
    const a = ['love', 'work', 'mood'];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function fortuneThree(items) {
    const [past, present, future] = items;
    const parts = [];
    parts.push(pick(OPEN_3));
    parts.push(
      '**อดีต (' + nameOf(past) + ')** ทิ้งร่องรอยไว้ว่า “' + kwOf(past) + '” — ' +
      weaveSnippet(past) +
      ' สิ่งนี้หล่อหลอมวิธีที่คุณรับมือกับคนและโอกาสมาจนถึงตอนนี้.'
    );
    parts.push(
      '**ปัจจุบัน (' + nameOf(present) + ')** คุณยืนอยู่ท่ามกลาง “' + kwOf(present) + '” — ' +
      flavorFor(present, 'mood') + ' ' +
      aspectSentence(present, 'love').replace(/\.$/, '') +
      ' ส่วน' + aspectSentence(present, 'work').replace(/^ด้าน|^ใน|^เรื่อง/, (m) => m)
    );
    // Cleaner present block without messy concat — rebuild:
    parts.pop();
    parts.push(
      '**ปัจจุบัน (' + nameOf(present) + ')** จังหวะตอนนี้คือ “' + kwOf(present) + '”. ' +
      flavorFor(present, 'mood') + ' ' +
      flavorFor(present, 'love') + ' ' +
      flavorFor(present, 'work')
    );
    parts.push(
      '**อนาคต (' + nameOf(future) + ')** ทางข้างหน้าโน้มไปทาง “' + kwOf(future) + '” — ' +
      weaveSnippet(future) +
      (future.reversed
        ? ' อาจมีอุปสรรคหรือความล่าช้า แต่ถ้าปรับมุมจะผ่านได้.'
        : ' ถ้าเดินด้วยสติ คลื่นนี้จะพาไปสู่ผลที่อบอุ่นขึ้น.')
    );
    parts.push(
      '**ภาพรวม** จาก' + nameOf(past) + ' → ' + nameOf(present) + ' → ' + nameOf(future) +
      ' เรื่องราวของคุณกำลัง' + synthesize(items) + ' ' + pick(ADVICE)
    );
    return parts.join('\n\n');
  }

  function synthesize(items) {
    const revs = items.filter((x) => x.reversed).length;
    const suits = items.map((x) => domain(x.card));
    const hasCups = suits.includes('cups');
    const hasSwords = suits.includes('swords');
    const hasWands = suits.includes('wands');
    const hasPents = suits.includes('pentacles');
    const hasMajor = suits.includes('life');

    const bits = [];
    if (revs >= 2) {
      bits.push(pick([
        'ชวนให้ทบทวนสิ่งที่ค้างคา และปล่อยรูปแบบเก่าที่ไม่ได้ผลแล้ว',
        'บอกว่ายังมีปมที่ต้องเคลียร์ก่อนความราบรื่นจะมาเต็มที่'
      ]));
    } else if (revs === 0) {
      bits.push(pick([
        'ไหลไปข้างหน้าอย่างมีแสงนำ — พลังงานโดยรวมเปิดรับได้ดี',
        'สนับสนุนการก้าวต่อด้วยความมั่นใจที่ไม่ประมาท'
      ]));
    } else {
      bits.push(pick([
        'ผสมระหว่างโอกาสและความท้าทาย — สมดุลคือกุญแจ',
        'มีทั้งสิ่งที่ผลักคุณไปข้างหน้าและสิ่งที่ขอให้ชะลอเพื่อเยียวยา'
      ]));
    }
    if (hasMajor) {
      bits.push(pick([
        'มีบทเรียนชีวิตสำคัญซ่อนอยู่ อย่ามองแค่รายละเอียดเล็กๆ',
        'ช่วงนี้มีความหมายระดับจิตวิญญาณหรืออัตลักษณ์ ไม่ใช่แค่เหตุการณ์ผ่านๆ'
      ]));
    }
    if (hasCups && hasSwords) {
      bits.push('หัวใจกับความคิดกำลังต้องเจรจากัน — ฟังทั้งสองฝ่าย.');
    } else if (hasCups) {
      bits.push('เส้นเรื่องโน้มไปทางความรู้สึกและความสัมพันธ์.');
    } else if (hasSwords) {
      bits.push('เส้นเรื่องโน้มไปทางความจริง การตัดสินใจ และความชัดเจน.');
    }
    if (hasWands && hasPents) {
      bits.push('ไฟแห่งแรงบันดาลใจต้องวางบนรากฐานที่จับต้องได้ถึงจะยั่งยืน.');
    } else if (hasWands) {
      bits.push('ประกายแอ็กชันพร้อมจุด — เลือกเป้าหมายแล้วพุ่ง.');
    } else if (hasPents) {
      bits.push('โฟกัสที่ความมั่นคง งานฝีมือ และการสะสมระยะยาว.');
    }
    return bits.join(' ');
  }

  function questionLead(question) {
    const q = (question || '').trim();
    if (!q) {
      return pick([
        'ต่อคำถามที่คุณเก็บไว้ในใจอย่างเงียบๆ…',
        'แม้ไม่ได้เอ่ยออกมา คำถามของคุณก็ลอยอยู่ในห้องนี้แล้ว…',
        'ออราเคิลรับสัญญาณจากสิ่งที่คุณเพิ่งหลับตาคิด…'
      ]);
    }
    const short = q.length > 60 ? q.slice(0, 57) + '…' : q;
    return pick([
      'ต่อคำถามที่คุณฝากไว้ว่า 「' + short + '」…',
      'สายหมอกวนรอบคำถาม 「' + short + '」 แล้วไพ่ก็ตอบกลับมา',
      'คุณถามว่า 「' + short + '」 — นี่คือภาพที่ห้องออราเคิลฉายให้เห็น'
    ]);
  }

  function buildFortune(items, question) {
    if (!items || !items.length) return '';
    const lead = questionLead(question);
    if (items.length === 1) return lead + ' ' + fortuneOne(items[0]);
    return lead + '\n\n' + fortuneThree(items);
  }

  // Convert simple **bold** markers to HTML
  function fortuneToHtml(text) {
    return text
      .split(/\n\n+/)
      .map((p) => '<p>' + p.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') + '</p>')
      .join('');
  }

  global.OracleReading = {
    buildFortune,
    fortuneToHtml,
    kwOf,
    nameOf
  };
})(window);
