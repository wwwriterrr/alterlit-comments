export const getLastWord = () => {
    const selection = window.getSelection();
    if(!selection) return '';
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer; // Узнаем, в каком узле находится каретка
    const offset = range.startOffset; // Позиция каретки

    // Проверяем, что курсор находится в текстовом узле
    if (textNode.nodeType === Node.TEXT_NODE) {
        if(!textNode.textContent) return '';
        const textBeforeCaret = textNode.textContent.slice(0, offset); // Текст перед кареткой

        if(textBeforeCaret.endsWith(' ')) return '';

        // Ищем последнее слово в этом тексте
        const words = textBeforeCaret.trim().split(/\s+/); // Разделяем текст по пробелам
        const lastWord = words[words.length - 1]; // Берем последнее слово

        return lastWord;
    }

    return '';
}