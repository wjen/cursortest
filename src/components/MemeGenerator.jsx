import { useState, useRef, useEffect } from "react"

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 500
const DEFAULT_FONT_SIZE = 48
const MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 120
const FONT_FAMILY = 'Impact, "Arial Black", sans-serif'
const TEXT_STROKE_WIDTH = 3
const PADDING = 16

// Update this list to match the images you added.
// If your files are in `public/assets`, use paths like `/assets/your-file.png`.
const TEMPLATE_IMAGES = [
    { label: "Hero", src: "/assets/Hero.png" },
    { label: "Image", src: "/assets/image.png" },
]

export default function MemeGenerator() {
    const canvasRef = useRef(null)
    const [image, setImage] = useState(null)
    const [imageUrl, setImageUrl] = useState(null)
    const [selectedTemplate, setSelectedTemplate] = useState("")
    const [topText, setTopText] = useState("")
    const [bottomText, setBottomText] = useState("")
    const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
    const [lineSpacing, setLineSpacing] = useState(1.1) // multiplier

    const loadImageFromUrl = (url) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            setImage(img)
        }
        img.src = url
    }

    // Load image from file
    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (imageUrl) URL.revokeObjectURL(imageUrl)
        const url = URL.createObjectURL(file)
        setImageUrl(url)
        setSelectedTemplate("")
        loadImageFromUrl(url)
    }

    // Load image from selected template
    const handleTemplateChange = (e) => {
        const value = e.target.value
        setSelectedTemplate(value)
        if (!value) return
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl)
            setImageUrl(null)
        }
        loadImageFromUrl(value)
    }

    // Draw meme: image + text (white with black border)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        canvas.width = CANVAS_WIDTH
        canvas.height = CANVAS_HEIGHT

        // Clear
        ctx.fillStyle = "#222"
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        if (image) {
            // Scale image to fit canvas (cover)
            const scale = Math.max(
                CANVAS_WIDTH / image.width,
                CANVAS_HEIGHT / image.height,
            )
            const w = image.width * scale
            const h = image.height * scale
            const x = (CANVAS_WIDTH - w) / 2
            const y = (CANVAS_HEIGHT - h) / 2
            ctx.drawImage(image, x, y, w, h)
        }

        ctx.textAlign = "center"
        ctx.font = `${fontSize}px ${FONT_FAMILY}`
        ctx.lineWidth = TEXT_STROKE_WIDTH
        ctx.lineJoin = "round"
        ctx.miterLimit = 2

        const maxTextWidth = CANVAS_WIDTH - PADDING * 2
        const lineHeight = fontSize * lineSpacing

        const wrapText = (text) => {
            const paragraphs = text.split("\n")
            const lines = []

            paragraphs.forEach((para, idx) => {
                const words = para.split(" ")
                let currentLine = ""

                for (let i = 0; i < words.length; i++) {
                    const word = words[i]
                    if (!word) continue
                    const testLine = currentLine
                        ? `${currentLine} ${word}`
                        : word
                    const { width } = ctx.measureText(testLine)
                    if (width > maxTextWidth && currentLine) {
                        lines.push(currentLine)
                        currentLine = word
                    } else {
                        currentLine = testLine
                    }
                }

                if (currentLine) lines.push(currentLine)

                // Preserve manual blank line between paragraphs
                if (idx < paragraphs.length - 1) {
                    lines.push("")
                }
            })

            return lines
        }

        const drawWrappedTextTop = (text) => {
            const trimmed = text.trim()
            if (!trimmed) return
            const lines = wrapText(trimmed)
            const x = CANVAS_WIDTH / 2
            let y = PADDING

            ctx.strokeStyle = "black"
            ctx.fillStyle = "white"
            ctx.textBaseline = "top"

            lines.forEach((line) => {
                if (line) {
                    ctx.strokeText(line, x, y)
                    ctx.fillText(line, x, y)
                }
                y += lineHeight
            })
        }

        const drawWrappedTextBottom = (text) => {
            const trimmed = text.trim()
            if (!trimmed) return
            const lines = wrapText(trimmed)
            const x = CANVAS_WIDTH / 2
            let y = CANVAS_HEIGHT - PADDING - lineHeight * (lines.length - 1)

            ctx.strokeStyle = "black"
            ctx.fillStyle = "white"
            ctx.textBaseline = "top"

            lines.forEach((line) => {
                if (line) {
                    ctx.strokeText(line, x, y)
                    ctx.fillText(line, x, y)
                }
                y += lineHeight
            })
        }

        drawWrappedTextTop(topText)
        drawWrappedTextBottom(bottomText)
    }, [image, topText, bottomText, fontSize, lineSpacing])

    const handleDownload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const link = document.createElement("a")
        link.download = "meme.png"
        link.href = canvas.toDataURL("image/png")
        link.click()
    }

    return (
        <div style={styles.container}>
            <div style={styles.controls}>
                {TEMPLATE_IMAGES.length > 0 && (
                    <label style={styles.label}>
                        Template
                        <select
                            value={selectedTemplate}
                            onChange={handleTemplateChange}
                            style={styles.select}
                        >
                            <option value="">Choose a template</option>
                            {TEMPLATE_IMAGES.map((tpl) => (
                                <option key={tpl.src} value={tpl.src}>
                                    {tpl.label}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                <label style={styles.label}>
                    Template imagessss
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={styles.fileInput}
                    />
                </label>

                <label style={styles.label}>
                    Top text
                    <textarea
                        value={topText}
                        onChange={(e) => setTopText(e.target.value)}
                        placeholder="Top text"
                        rows={2}
                        style={styles.textarea}
                    />
                </label>

                <label style={styles.label}>
                    Bottom text
                    <textarea
                        value={bottomText}
                        onChange={(e) => setBottomText(e.target.value)}
                        placeholder="Bottom text"
                        rows={2}
                        style={styles.textarea}
                    />
                </label>

                <label style={styles.label}>
                    Text size: {fontSize}px
                    <input
                        type="range"
                        min={MIN_FONT_SIZE}
                        max={MAX_FONT_SIZE}
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        style={styles.slider}
                    />
                </label>

                <label style={styles.label}>
                    Line spacing: {lineSpacing.toFixed(2)}x
                    <input
                        type="range"
                        min={0.8}
                        max={2}
                        step={0.05}
                        value={lineSpacing}
                        onChange={(e) => setLineSpacing(Number(e.target.value))}
                        style={styles.slider}
                    />
                </label>

                <button
                    onClick={handleDownload}
                    disabled={!image}
                    style={{
                        ...styles.button,
                        opacity: image ? 1 : 0.5,
                        cursor: image ? "pointer" : "not-allowed",
                    }}
                >
                    Download meme
                </button>
            </div>

            <div style={styles.canvasWrap}>
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    style={styles.canvas}
                />
            </div>
        </div>
    )
}

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        alignItems: "center",
    },
    controls: {
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        alignItems: "flex-end",
        justifyContent: "center",
    },
    label: {
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        fontSize: "0.9rem",
    },
    fileInput: {
        padding: "0.5rem",
        background: "#2d2d44",
        border: "1px solid #444",
        borderRadius: 6,
        color: "#eee",
        cursor: "pointer",
    },
    input: {
        padding: "0.5rem 0.75rem",
        background: "#2d2d44",
        border: "1px solid #444",
        borderRadius: 6,
        color: "#eee",
        minWidth: 160,
    },
    textarea: {
        padding: "0.5rem 0.75rem",
        background: "#2d2d44",
        border: "1px solid #444",
        borderRadius: 6,
        color: "#eee",
        minWidth: 160,
        resize: "vertical",
        fontFamily: "inherit",
        fontSize: "0.9rem",
    },
    slider: {
        width: 160,
        accentColor: "#0ea5e9",
    },
    button: {
        padding: "0.6rem 1.2rem",
        background: "#0ea5e9",
        border: "none",
        borderRadius: 8,
        color: "white",
        fontWeight: 600,
        fontSize: "0.95rem",
    },
    canvasWrap: {
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    },
    canvas: {
        display: "block",
        maxWidth: "100%",
        height: "auto",
        background: "#222",
    },
}
