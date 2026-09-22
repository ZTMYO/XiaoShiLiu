/**
 * 文字配图底图模板。
 *
 * 每个模板只吃一个主色，图里所有元素都由主色按色相偏移和明暗档位派生，
 * 所以换一个主色就是整张图换一套色，不用逐项调。
 *
 * 模板产出的是 SVG 字符串：同一份定义既能当模板列表的缩略图（直接塞进 <img>），
 * 也能在 canvas 里当底图（转成 data URI 后 drawImage），所见即所得。
 */

const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 600

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const hsl = (h, s, l) => `hsl(${Math.round((h + 360) % 360)}, ${clamp(Math.round(s), 0, 100)}%, ${clamp(Math.round(l), 0, 100)}%)`

const hexToHsl = (hex) => {
  const raw = String(hex).replace('#', '')
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
  }

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  return { h: h * 60, s: s * 100, l: l * 100 }
}

const tuneSat = (s) => clamp(s, 14, 100)

const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

const todayLabel = () => {
  const now = new Date()
  return `${MONTH_ABBR[now.getMonth()]}.${now.getDate()}`
}

const buildWashFrame = (color) => {
  const main = hexToHsl(color)
  const sat = tuneSat(main.s)
  const background = hsl(main.h + 4, sat * 0.35, 98.5)
  const blob1 = {
    cx: 340,
    cy: 460,
    r: 210,
    hue: 2,
    satShift: -10,
    light: main.l + 6,
    opacity: 0.55
  }

  const blob2 = {
    cx: 360,
    cy: 120,
    r: 90,
    hue: 8,
    satShift: -18,
    light: main.l + 16,
    opacity: 0.35
  }

  const blob3 = {
    cx: 40,
    cy: 300,
    r: 140,
    hue: -6,
    satShift: -24,
    light: main.l + 28,
    opacity: 0.28
  }

  const blobs = [blob1, blob2, blob3]
    .map(({ cx, cy, r, hue, satShift, light, opacity }) => {
      const fill = hsl(main.h + hue, sat + satShift, light)
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"/>`
    })
    .join('\n    ')

  const grain = `
    <filter id="frame-grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="
        0 0 0 0 0.95
        0 0 0 0 0.95
        0 0 0 0 0.96
        0 0 0 0.45 0
      "/>
    </filter>
    <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" filter="url(#frame-grain)" opacity="0.55" pointer-events="none"/>
  `
  const dots = `
    <circle cx="36" cy="30" r="4" fill="${hsl(main.h, sat, 74)}" opacity="0.85"/>
    <circle cx="48" cy="30" r="4" fill="${hsl(main.h, sat, 74)}" opacity="0.85"/>
    <circle cx="60" cy="30" r="4" fill="${hsl(main.h, sat, 74)}" opacity="0.85"/>
  `

  const dateText = `
    <text x="${CANVAS_WIDTH - 24}" y="34" font-family="Arial, sans-serif" font-size="14" fill="${hsl(main.h, sat, 72)}" opacity="0.8" text-anchor="end" letter-spacing="1">${todayLabel()}</text>
  `

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">
  <defs>
    <filter id="frame-wash-blur" x="-70%" y="-70%" width="240%" height="240%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="48"/>
    </filter>
    ${grain}
  </defs>

  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="${background}"/>

  <g filter="url(#frame-wash-blur)">
    ${blobs}
  </g>

  ${dots}
  ${dateText}
</svg>`
}

const buildQuoteFrame = (color) => {
  const main = hexToHsl(color)
  const sat = tuneSat(main.s)

  const background = hsl(main.h, sat * 0.75, 96)
  const accent = hsl(main.h, sat, main.l - 8)

  const quotePath = "M503.431856 737.541944c0 84.222532-0.71375 168.445063 0.475834 252.667596 0.356875 24.981259-7.375419 33.784179-33.189388 33.665221-146.199847-0.951667-292.280735-0.832709-438.480582-0.118959C8.683962 1023.874761 0 1016.261424 0.237917 992.112874c1.070625-143.225887-2.260209-286.570733 2.260209-429.677662 3.806668-120.147962 17.843757-240.295924 77.322946-348.191173C141.322553 102.66108 235.299672 31.405012 360.087011 1.427501c16.535215-3.925626 25.457093 0.237917 32.118762 14.988755 16.773131 36.996056 33.546263 73.992111 51.508977 110.512333 9.635629 19.747091 4.520418 29.739595-15.821464 36.520223-70.542318 23.553759-129.783591 63.04794-175.582566 122.884004-31.880845 41.754391-45.204184 88.980867-50.438352 139.895053-2.379168 23.315842 11.182088 24.743343 28.55001 24.624384 79.345238-0.356875 158.690476 0.594792 238.035715-0.594792 25.932926-0.356875 35.92543 7.375419 35.449597 34.616888-1.308542 84.222532-0.475834 168.445063-0.475834 252.667595zM1189.583781 738.255695v249.693635s-9.51667 36.163347-36.877097 36.044389c-143.225887-1.070625-286.451775-1.070625-429.79662 0-26.646677 0.237917-37.709806-6.185836-37.352931-35.330638 1.546459-139.419219-0.832709-278.838438 1.784376-418.138699 1.903334-101.828372 14.393964-203.061951 51.627936-298.823446C793.809257 130.021507 895.875546 40.207932 1043.383935 1.903334c19.390216-4.996252 28.550011 0.951667 35.92543 17.724798 15.940423 36.282305 32.118762 72.564611 49.84356 108.133166 10.349379 20.698758 3.092918 29.263761-16.654173 35.687514-76.847112 25.338135-138.943386 70.542318-185.337153 137.634843-26.40876 38.185639-34.854805 81.129614-39.851056 125.739006-2.260209 20.341883 8.921878 24.267509 26.289801 24.267509 80.296905-0.356875 160.712769 0.71375 241.009674-0.594792 26.765635-0.475834 35.330638 8.921878 34.854805 35.21168 0-0.118958 0.118958 168.326105 0.118958 252.548637z"

  // 引号位置、缩放
  const quoteX = 36
  const quoteY = 40
  const quoteScale = 0.06

  const rectX = CANVAS_WIDTH - 96
  const rectY = CANVAS_HEIGHT - 48
  const rectW = 36
  const rectH = 10

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">
  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="${background}"/>
  <g transform="translate(${quoteX},${quoteY}) scale(${quoteScale})">
    <path d="${quotePath}" fill="${accent}"/>
  </g>
  <rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" fill="${accent}"/>
</svg>`
}

const QUESTION_MARKS = [
  { x: 150, y: 200, scale: 0.24, rotate: -6, opacity: 0.42 },
  { x: 305, y: 435, scale: 0.13, rotate: 12, opacity: 0.32 },
  { x: 62, y: 548, scale: 0.055, rotate: -14, opacity: 0.5 },
  { x: -50, y: 350, scale: 0.21, rotate: 16, opacity: 0.22 },
  { x: 415, y: 650, scale: 0.19, rotate: -10, opacity: 0.26 }
]

const QUESTION_PATH = 'M828 304c0 105.2-59.7 196.5-147.1 241.7-23.6 12.2-42.8 30.5-56.2 52.4-15.7 25.8-23.2 56.6-20 88.3 1 9.4-6.4 17.6-15.9 17.6H446.3c-18.9 0-34.3-15.3-34.3-34.3 0-127.4 71.3-243 183.2-303.9 24.3-13.2 40.9-33.7 40.7-65.2-0.2-42.5-35.4-76.6-77.9-76.6h-50c-31.9 0-59.5 18.8-72.3 45.8a31.98 31.98 0 0 1-28.9 18.2h-134c-20.3 0-35.4-18.6-31.4-38.4 1.8-8.7 3.9-17.2 6.5-25.6C282.1 112.8 385.6 32 508 32h48c75.1 0 143.1 30.4 192.3 79.7C797.6 160.9 828 228.9 828 304zM636 864c0 35.3-14.3 67.3-37.5 90.5-23.2 23.2-55.2 37.5-90.5 37.5s-67.3-14.3-90.5-37.5C394.3 931.3 380 899.3 380 864c0-70.7 57.3-128 128-128 35.3 0 67.3 14.3 90.5 37.5 23.2 23.2 37.5 55.2 37.5 90.5z'

const buildQuestionMarkFrame = (color) => {
  const main = hexToHsl(color)
  const sat = tuneSat(main.s)

  const background = hsl(main.h, sat * 0.3, 98)
  // 记号压到中明度，否则和接近纯白的底色只差几个百分点，肉眼基本看不见
  const accent = hsl(main.h, sat * 0.6, 78)

  const questions = QUESTION_MARKS.map(
    ({ x, y, scale, rotate, opacity }) => `
      <g transform="translate(${x},${y}) rotate(${rotate}) scale(${scale}) translate(-504,-512)" opacity="${opacity}">
        <path d="${QUESTION_PATH}" fill="${accent}"/>
      </g>
    `
  ).join('\n    ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">
  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="${background}"/>
  <g>
    ${questions}
  </g>
</svg>`
}

const buildPaperNoteFrame = (color) => {
  const main = hexToHsl(color)
  const sat = tuneSat(main.s)

  const background = color
  const paper = hsl(main.h, sat * 0.25, 98)
  const line = hsl(main.h, sat * 0.45, 78)
  const dot = hsl(main.h, sat * 0.5, 72)

  const paperX = 40
  const paperY = 40
  const paperW = CANVAS_WIDTH - 80
  const paperH = CANVAS_HEIGHT - 80
  const radius = 18

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">
  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="${background}"/>
  <rect x="${paperX + 10}" y="${paperY + 14}" width="${paperW}" height="${paperH}" rx="${radius}" fill="${paper}" opacity="0.65"/>
  <rect x="${paperX}" y="${paperY}" width="${paperW}" height="${paperH}" rx="${radius}" fill="${paper}"/>
  <circle cx="${paperX + 24}" cy="${paperY + 22}" r="3" fill="${dot}"/>
  <circle cx="${paperX + 34}" cy="${paperY + 22}" r="3" fill="${dot}"/>
  <circle cx="${paperX + 44}" cy="${paperY + 22}" r="3" fill="${dot}"/>
  <text x="${paperX + paperW - 22}" y="${paperY + 26}" font-family="Arial, sans-serif" font-size="13" fill="${dot}" text-anchor="end">Text Note</text>
  <line x1="${paperX + 20}" y1="${paperY + paperH - 24}" x2="${paperX + paperW - 20}" y2="${paperY + paperH - 24}" stroke="${line}" stroke-width="1.2" opacity="0.8"/>
  <line x1="${paperX + 20}" y1="${paperY + paperH - 12}" x2="${paperX + paperW - 20}" y2="${paperY + paperH - 12}" stroke="${line}" stroke-width="1" opacity="0.45"/>
</svg>`
}

const UPLOAD_ICON_PATH = 'M731.428571 341.333333h73.142858a73.142857 73.142857 0 0 1 73.142857 73.142857v414.476191a73.142857 73.142857 0 0 1-73.142857 73.142857H219.428571a73.142857 73.142857 0 0 1-73.142857-73.142857V414.47619a73.142857 73.142857 0 0 1 73.142857-73.142857h73.142858v73.142857H219.428571v414.476191h585.142858V414.47619h-73.142858v-73.142857zM518.460952 93.671619l172.373334 172.373333-51.687619 51.736381-84.601905-84.577523v348.306285h-73.142857V234.22781l-83.626667 83.577904-51.712-51.712 172.373333-172.397714z'

const MORE_ICON_PATHS = [
  'M512 42.666667a469.333333 469.333333 0 1 0 469.333333 469.333333A469.333333 469.333333 0 0 0 512 42.666667z m0 864a394.666667 394.666667 0 1 1 394.666667-394.666667 395.146667 395.146667 0 0 1-394.666667 394.666667z',
  'M304.906667 512m-66.666667 0a66.666667 66.666667 0 1 0 133.333333 0 66.666667 66.666667 0 1 0-133.333333 0Z',
  'M512 512m-66.666667 0a66.666667 66.666667 0 1 0 133.333334 0 66.666667 66.666667 0 1 0-133.333334 0Z',
  'M719.093333 512m-66.666666 0a66.666667 66.666667 0 1 0 133.333333 0 66.666667 66.666667 0 1 0-133.333333 0Z'
]

const buildMemoFrame = (color) => {
  const background = '#ffffff'
  const gridLine = '#9a9a9a'
  const uiColor = color

  const cell = 24
  // +1 让网格补到画布右下角，否则最右一列、最下一行缺收边线
  const cols = Math.floor(CANVAS_WIDTH / cell) + 1
  const rows = Math.floor(CANVAS_HEIGHT / cell) + 1

  const verticalLines = Array.from({ length: cols }).map((_, i) => {
    const x = i * cell
    return `<line x1="${x}" y1="72" x2="${x}" y2="${CANVAS_HEIGHT}" stroke="${gridLine}" stroke-width="0.6" opacity="0.4"/>`
  }).join('\n    ')

  const horizontalLines = Array.from({ length: rows }).map((_, i) => {
    const y = i * cell
    if (y < 72) return ''
    return `<line x1="0" y1="${y}" x2="${CANVAS_WIDTH}" y2="${y}" stroke="${gridLine}" stroke-width="0.6" opacity="0.4"/>`
  }).filter(Boolean).join('\n    ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">
  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="${background}"/>
  <g>
    <path d="M16 36 L28 24 L28 48 Z" fill="${uiColor}"/>
    <text x="42" y="42" font-family="Arial, sans-serif" font-size="24" fill="${uiColor}" font-weight="500">Notes</text>
    <g transform="translate(${CANVAS_WIDTH - 100}, 36) scale(0.04) translate(-512,-512)">
      <path d="${UPLOAD_ICON_PATH}" fill="${uiColor}"/>
    </g>
    <g transform="translate(${CANVAS_WIDTH - 52}, 36) scale(0.03125) translate(-512,-512)">
      <path d="${MORE_ICON_PATHS[0]}" fill="${uiColor}"/>
      <path d="${MORE_ICON_PATHS[1]}" fill="${uiColor}"/>
      <path d="${MORE_ICON_PATHS[2]}" fill="${uiColor}"/>
      <path d="${MORE_ICON_PATHS[3]}" fill="${uiColor}"/>
    </g>
  </g>
  <g>
    ${verticalLines}
    ${horizontalLines}
  </g>
</svg>`
}

const STAR_PATH = 'M556.651163 4.167442C524.502326 11.906977 513.190698 33.339535 461.395349 190.511628c-53.581395 162.530233-48.818605 157.172093-202.418605 208.372093C80.967442 458.418605 65.488372 467.348837 65.488372 512c0.595349 40.483721 13.097674 47.627907 164.316279 100.018605 66.083721 23.218605 128 45.84186 137.525582 50.604651 38.102326 19.646512 51.2 44.055814 96.446511 176.818604 49.413953 144.074419 54.772093 156.576744 73.227907 169.07907 19.051163 13.097674 55.962791 11.906977 69.655814-1.786046 18.455814-18.455814 26.195349-36.911628 66.083721-158.362791 41.07907-125.023256 51.2-148.24186 73.227907-168.483721 9.525581-8.930233 65.488372-31.553488 150.027907-61.32093 169.674419-58.344186 180.986047-65.488372 181.581395-108.353489 0-39.888372-17.265116-50.604651-154.790697-96.446511-145.860465-48.223256-174.437209-61.916279-193.488372-94.660465-7.739535-13.693023-32.744186-77.990698-55.367442-143.47907-22.623256-65.488372-44.651163-126.213953-47.627907-135.144186-10.12093-25.004651-43.460465-42.269767-69.655814-36.316279z'

const STAR_PATH_CENTER_X = 556.651163
const STAR_PATH_CENTER_Y = 512
const STAR_PATH_BOX = 1024

const buildNotepadFrame = (color) => {
  const main = hexToHsl(color)
  const sat = tuneSat(main.s)

  const background = hsl(
    main.h,
    sat * 0.28,
    93
  )

  const paper = '#ffffff'

  const gridLine = hsl(
    main.h,
    sat * 0.12,
    88
  )

  const outline = hsl(
    main.h,
    Math.min(sat * 0.28, 35),
    12
  )

  const edge = hsl(
    main.h,
    sat * 0.72,
    clamp(main.l - 4, 42, 72)
  )

  const sparkle = hsl(
    main.h,
    sat * 0.68,
    clamp(main.l + 2, 48, 78)
  )

  const sparkleLight = hsl(
    main.h,
    sat * 0.25,
    92
  )

  const paperX = 32
  const paperY = 34
  const paperW = 336
  const paperH = 532
  const paperR = 11

  const cell = 20

  const cols = Math.ceil(paperW / cell) + 1
  const rows = Math.ceil(paperH / cell) + 1

  const verticalLines = Array.from({
    length: cols
  }).map((_, i) => {
    const x = paperX + i * cell

    return `
      <line
        x1="${x}"
        y1="${paperY}"
        x2="${x}"
        y2="${paperY + paperH}"
        stroke="${gridLine}"
        stroke-width="0.7"
        opacity="0.62"
      />
    `
  }).join('')

  const horizontalLines = Array.from({
    length: rows
  }).map((_, i) => {
    const y = paperY + i * cell

    return `
      <line
        x1="${paperX}"
        y1="${y}"
        x2="${paperX + paperW}"
        y2="${y}"
        stroke="${gridLine}"
        stroke-width="0.7"
        opacity="0.62"
      />
    `
  }).join('')

  const ringPositions = [
    paperY + 48,
    paperY + 96,
    paperY + paperH - 96,
    paperY + paperH - 48
  ]

  const rings = ringPositions.map((y) => `
    <g>
      <circle
        cx="44"
        cy="${y}"
        r="8"
        fill="${paper}"
        stroke="${outline}"
        stroke-width="2.4"
      />

      <rect
        x="9"
        y="${y - 5}"
        width="34"
        height="10"
        rx="5"
        fill="${paper}"
        stroke="${outline}"
        stroke-width="2.4"
      />

      <circle
        cx="43"
        cy="${y}"
        r="3"
        fill="${paper}"
      />
    </g>
  `).join('')

  const starMark = (cx, cy, size, fill, strokeWidth) => {
    const scale = size / STAR_PATH_BOX

    return `<g transform="translate(${cx} ${cy}) scale(${scale}) translate(${-STAR_PATH_CENTER_X} ${-STAR_PATH_CENTER_Y})"><path d="${STAR_PATH}" fill="${fill}" stroke="${outline}" stroke-width="${strokeWidth / scale}" stroke-linejoin="round"/></g>`
  }

  const topStars = `
    ${starMark(362, 48, 40, sparkle, 2.4)}
    ${starMark(382, 28, 26, sparkleLight, 2.1)}
    ${starMark(365, 15, 18, sparkleLight, 2)}
  `

  const bottomStars = `
    ${starMark(43, 568, 40, sparkle, 2.4)}
    ${starMark(22, 579, 20, sparkleLight, 2)}
    ${starMark(55, 552, 16, sparkleLight, 2)}
  `

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${CANVAS_WIDTH}"
      height="${CANVAS_HEIGHT}"
      viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}"
    >

      <defs>

        <clipPath id="notepad-paper-clip">
          <rect
            x="${paperX}"
            y="${paperY}"
            width="${paperW}"
            height="${paperH}"
            rx="${paperR}"
          />
        </clipPath>

        <filter
          id="notepad-shadow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="1"
            dy="2"
            stdDeviation="2"
            flood-color="${outline}"
            flood-opacity="0.12"
          />
        </filter>

      </defs>

      <rect
        width="${CANVAS_WIDTH}"
        height="${CANVAS_HEIGHT}"
        fill="${background}"
      />

      <rect
        x="${paperX}"
        y="${paperY}"
        width="${paperW + 13}"
        height="${paperH + 14}"
        rx="${paperR + 3}"
        fill="${edge}"
      />

      <rect
        x="${paperX}"
        y="${paperY}"
        width="${paperW}"
        height="${paperH}"
        rx="${paperR}"
        fill="${paper}"
        filter="url(#notepad-shadow)"
      />

      <g clip-path="url(#notepad-paper-clip)">
        ${verticalLines}
        ${horizontalLines}
      </g>

      <rect
        x="${paperX}"
        y="${paperY}"
        width="${paperW}"
        height="${paperH}"
        rx="${paperR}"
        fill="none"
        stroke="${outline}"
        stroke-width="2.8"
        stroke-linejoin="round"
      />

      ${rings}
      ${topStars}
      ${bottomStars}

    </svg>
  `
}

export const framePresets = [
  { id: 'wash', name: '晕染', build: buildWashFrame },
  { id: 'quote', name: '引号', build: buildQuoteFrame },
  { id: 'question', name: '问号', build: buildQuestionMarkFrame },
  { id: 'paperNote', name: '便签', build: buildPaperNoteFrame },
  { id: 'memo', name: '备忘录', build: buildMemoFrame },
  { id: 'notepad', name: '记事本', build: buildNotepadFrame }
]

export const defaultFrameColor = '#dc3545'

// 各模板的文字安全区，文字只应落在框内，避免压到装饰元素
export const frameSafeAreas = {
  wash: { x: 44, y: 60, w: 312, h: 480 },
  quote: { x: 48, y: 120, w: 304, h: 404 },
  question: { x: 24, y: 24, w: 352, h: 552 },
  paperNote: { x: 64, y: 92, w: 272, h: 420 },
  memo: { x: 20, y: 72, w: 360, h: 504 },
  notepad: { x: 60, y: 76, w: 276, h: 460 }
}

export const framePalette = [
  '#dc3545',
  '#e65c8c',
  '#f0a8bc',
  '#f27759',
  '#f3aa8f',
  '#f7c288',
  '#f9e09f',
  '#a6d98b',
  '#68de72',
  '#64c8bf',
  '#22b8aa',
  '#b9ebf3',
  '#79a9e8',
  '#428cff',
  '#909ce6',
  '#936cf7'
]

export const frameToDataUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

export const renderFrame = (frame, color) => frameToDataUri(frame.build(color))
