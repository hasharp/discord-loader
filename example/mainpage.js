/* eslint-env browser */
'use strict';

(() => {
    const types = {
        'ogg': 'audio',
    };


    function ensureArray(value) {
        return Array.isArray(value) ? value : [value];
    }

    (function monitorAttachments() {
        let attachments = document.querySelectorAll('.attachment:not(.processed-attachment)');
        attachments.forEach(attachment => {
            const fileUrl = attachment.getElementsByTagName('a')[0].href;
            if (!fileUrl) return;

            const extension = fileUrl.replace(/^.+\./, '');
            const mediaTypes = types[extension] ? ensureArray(types[extension]) : ['video', 'audio'];

            for (let mediaType of mediaTypes) {
                let media = document.createElement(mediaType);

                const mimeType = `${mediaType}/${extension}`;
                if (!media.canPlayType(mimeType)) {
                    continue;
                }

                media.className = 'attachment-media';

                media.src = fileUrl;
                media.controls = true;
                media.preload = 'metadata';

                attachment.appendChild(media);

                break;
            }

            attachment.classList.add('processed-attachment');
        });

        setTimeout(monitorAttachments, 1000);
    })();

})();
