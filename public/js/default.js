/**
 * Copyright (c) 2017
 * kollus-custom-upload-jquery - Kollus Custom Upload JS by JQuery
 * Built on 2017-08-28
 *
 * @version 0.0.1
 * @link https://github.com/kollus-service/kollus-custom-upload-jquery.git
 * @license MIT
 */

/**
 * WebPage Initialize for alert-dismissible
 */

$(".alert-dismissible").fadeTo(2000, 500).slideUp(500, function () {
  $(".alert-dismissible").alert('close');
});

/**
 * renderUploadFileList
 *
 * @param {Array} items
 * @returns {HTMLElement}
 */
function renderUploadFileList(items) {
  var uploadFileTables = $(
    '<hr />\n' +
    '<span id="in-transcoding"><span class="fa fa-refresh fa-spin"></span> In transcoding....</span>\n' +
    '<table class="table table-striped">\n' +
    '    <thead>\n' +
    '    <tr>\n' +
    '        <th class="upload-file-key">Upload file key</th>\n' +
    '        <th class="title">Title</th>\n' +
    '        <th class="transcoding-stage">Transcoding stage</th>\n' +
    '        <th class="created-at">Created at</th>\n' +
    '    </tr>\n' +
    '    </thead>\n' +
    '    <tbody>\n' +
    '    </tbody>\n' +
    '</table>'
    ),
    tableRow;

  $.each(items, function (key, item) {
    tableRow = $(
      '<tr>\n' +
      '    <td class="upload-file-key"><span class="label label-default">' + item.upload_file_key + '</span></td>\n' +
      '    <td class="title">' + item.title + '</td>\n' +
      '    <td class="transcoding-stage"><span class="label label-' + (item.transcoding_stage === 21 ? 'success' : 'warning') + '">' +
      item.transcoding_stage_name + '</span></td>\n' +
      '    <td class="created-at">' + moment.unix(item.created_at).format('YYYY-DD-MM HH:mm:ss') + '</td>' +
      '</tr>'
    );
    uploadFileTables.find('tbody').append(tableRow);
  });

  return uploadFileTables;
}

/**
 * updateUploadFileList
 *
 * @param {number|undefined} repeator
 */
function updateUploadFileList(repeator)
{
  $.ajax({
    url: '/api/upload_file',
    type: 'GET',
    dataType: 'json',
    cache: false,
    success: function (data) {
      if ('items' in data ) {
        $('#upload-file-list').html(renderUploadFileList(data.items));
      }

      if ('auto_reload' in data && !data.auto_reload) {
        if (data.auto_reload) {
          $('#in-transcoding').show();
        } else {
          $('#in-transcoding').hide();
        }

        if (typeof repeator !== 'undefined') {
          clearInterval(repeator);
        }
      }
    },
    error: function (jqXHR, textStatus) {
      if ('responseJSON' in jqXHR &&
        'message' in jqXHR.responseJSON) {
        showAlert('danger', jqXHR.responseJSON.message);
      } else {
        showAlert('danger', textStatus);
      }
    }
  });
}

/**
 * After complate upload
 *
 * @param {number} period
 * @param {number} duration
 */
function AfterComplateUpload(period, duration) {
  var repeator;

  updateUploadFileList(repeator);

  setTimeout(function() {
    repeator = setInterval(function () {
      updateUploadFileList(repeator)
    }, period); // repeator
  }, duration); // timer
}

// default
AfterComplateUpload(5000, 10000);

/**
 * Show Instant Message.
 *
 * @param {string} type - success|info|warning|danger
 * @param {string} message
 */
function showAlert(type, message) {
  var alertDiv = $(
    '<div class="alert alert-' + type + ' alert-dismissible">\n' +
    '    <button type="button" class="close" data-dismiss="alert">&times;</button>' + message + '\n' +
    '</div>\n'
    ),
    delayDuration = 2000,
    slideUpDuration = 500;

  alertDiv.delay(delayDuration).slideUp(slideUpDuration);

  $('.flashes').append(alertDiv);
}

/**
 * Kollus Custom Upload JS by JQuery
 *
 * Upload event handler
 */
$(document).on('click', 'button[data-action=upload-file]', function (e) {
  e.preventDefault();

  var self = this,
    closestForm = $(self).closest('form'),
    createUploadApiUrl = '/api/upload/create_url',
    uploadFileInput = closestForm.find('input[type=file][name=upload-file]'),
    uploadFileCount,
    categoryKey = closestForm.find('select[name=category_key]').first().val(),
    useEncryption = closestForm.find('input[type=checkbox][name=use_encryption]').prop('checked'),
    isAudioUpload = closestForm.find('input[type=checkbox][name=is_audio_upload]').prop('checked'),
    forceIframeUpload = closestForm.find('input[type=checkbox][name=force_iframe_upload]').prop('checked'),
    forceProgressApi = closestForm.find('input[type=checkbox][name=force_progress_api]').prop('checked'),
    title = closestForm.find('input[type=text][name=title]').val(),
    apiData = {},
    progressInterval = 5000, // 5sec
    progressValue = 0,
    uploadIframeId = 'upload_iframe',
    selectedUploadIframe,
    uploadUrl,
    progressUrl,
    uploadFileKey,
    uploadIframe = $('<iframe width="0" height="0" src="javascript: false;" style="display: none;"/>').
    attr('id', uploadIframeId).attr('name', uploadIframeId),
    closestFormAction = closestForm.attr('action'),
    supportFormData = function () {
      return !!window.FormData;
    },
    supportFileAPI = function () {
      var fi = document.createElement('INPUT');
      fi.type = 'file';
      return 'files' in fi;
    },
    supportCORS = function () {
      return 'XMLHttpRequest' in window &&
        'withCredentials' in new XMLHttpRequest();
    },
    supportAjaxUploadProgress = function () {
      var xhr = new XMLHttpRequest();
      return !!(xhr && ('upload' in xhr) && ('onprogress' in xhr.upload));
    };

  if (categoryKey.length > 0) {
    apiData.category_key = categoryKey;
  }
  if (useEncryption) {
    apiData.use_encryption = 1;
  }
  if (isAudioUpload) {
    apiData.is_audio_upload = 1;
  }
  if (title.length > 0) {
    apiData.title = title;
  }

  if (forceIframeUpload ||
    (!forceIframeUpload && (!supportFormData() || !supportFileAPI() || !supportCORS()))
  ) {
    // upload a file using iframe
    $.post(
      createUploadApiUrl,
      apiData,
      function (data) {
        var progress = $('<div class="progress" />'),
          progressBar = $('<div class="progress-bar progress-bar-striped active" style="min-width: 100%;" />');

        if (('error' in data && data.error) ||
          !('result' in data) ||
          !('upload_url' in data.result) ||
          !('progress_url' in data.result)) {
          showAlert('danger', ('message' in data ? data.message : 'Api response error.'));
        }

        uploadUrl = data.result.upload_url;
        progressUrl = data.result.progress_url;
        uploadFileKey = data.result.upload_file_key;

        selectedUploadIframe = $('#' + uploadIframeId);

        progress.addClass('progress-' + uploadFileKey);
        progressBar.attr('role', 'progressbar').text('Uploading ...');
        progress.append(progressBar);
        progress.insertBefore(uploadFileInput);

        showAlert('info', 'Uploading file ...');
        $(self).attr('disabled', true);

        if (!selectedUploadIframe.length) {
          $('body').append(uploadIframe);
          selectedUploadIframe = $('#' + uploadIframeId);
        }

        selectedUploadIframe.bind('load', function () {
          $(self).attr('disabled', false);

          // after complate
          AfterComplateUpload(5000, 10000);

          progress.delay(2000).fadeOut(500);

          closestForm.attr('action', closestFormAction);
          $(self).attr('disabled', false);
        });

        closestForm.attr('target', uploadIframeId).attr('action', uploadUrl);
        closestForm.submit();

        uploadFileInput.replaceWith(uploadFileInput.clone(true));
      }, // function (data)
      'json'
    );
    return;
  }

  uploadFileCount = uploadFileInput.prop('files').length;
  if (uploadFileCount === 0) {
    showAlert('warning', 'Please select a file to upload.');
    uploadFileInput.focus();
    return;
  }

  showAlert('info', 'Uploading file ...');
  $(self).attr('disabled', true);

  $.each(uploadFileInput.prop('files'), function (key, uploadFile) {
    $.post(
      createUploadApiUrl,
      apiData,
      function (data) {
        var formData = new FormData(),
          progress = $('<div class="progress" />'),
          progressBar,
          repeator;

        if (('error' in data && data.error) ||
          !('result' in data) ||
          !('upload_url' in data.result) ||
          !('progress_url' in data.result)) {
          showAlert('danger', ('message' in data ? data.message : 'Api response error.'));
        }

        uploadUrl = data.result.upload_url;
        progressUrl = data.result.progress_url;
        uploadFileKey = data.result.upload_file_key;

        progress.addClass('progress-' + uploadFileKey);
        progressBar = $('<div class="progress-bar" />').attr('aria-valuenow', 0);
        progressBar.attr('role', 'progressbar')
          .attr('aria-valuenow', 0).attr('aria-valuemin', 0).css('min-width', '2em').text('0%');
        progress.append(progressBar);
        progress.insertBefore(uploadFileInput);

        uploadFileInput.val('').clone(true);
        formData.append('upload-file', uploadFile);

        $.ajax({
          url: uploadUrl,
          type: 'POST',
          data: formData,
          dataType: 'json',
          cache: false,
          contentType: false,
          processData: false,
          xhr: function () {
            var xhr = new XMLHttpRequest();

            if (!forceProgressApi && supportAjaxUploadProgress()) {
              xhr.upload.addEventListener('progress', function (e) {

                if (e.lengthComputable) {
                  progressValue = Math.ceil((e.loaded / e.total) * 100);

                  if (progressValue > 0) {
                    progressBar.attr('arial-valuenow', progressValue);
                    progressBar.width(progressValue + '%');

                    if (progressValue > 10) {
                      progressBar.text(progressValue + '% - ' + uploadFile.name);
                    } else {
                      progressBar.text(progressValue + '%');
                    }
                  }
                }
              }, false);
            } else {
              progressBar.addClass('progress-bar-striped active');

              repeator = setInterval(function () {

                $.get(progressUrl, function (data) {

                  if ('result' in data &&
                    'progress' in data.result) {
                    progressValue = Math.ceil(parseInt(data.result.progress, 10));
                  }

                  if (progressValue > 0) {
                    progressBar.attr('arial-valuenow', progressValue);
                    progressBar.width(progressValue + '%');

                    if (progressValue > 10) {
                      progressBar.text(progressValue + '% - ' + uploadFile.name);
                    } else {
                      progressBar.text(progressValue + '%');
                    }
                  }
                }, 'json');
              }, progressInterval);
            }

            return xhr;
          }, // xhr
          success: function (data) {
            progressBar.attr('aria-valuenow', 100);
            progressBar.width('100%');
            progressBar.text(uploadFile.name + ' - 100%');
            if ('error' in data && data.error) {
              showAlert('danger', ('message' in data ? data.message : 'Api response error.'));
            } else {

              if ('message' in data) {
                showAlert('success', data.message + ' - ' + uploadFile.name);
              }
            }
          },
          error: function (jqXHR) {
            try {
              data = jqXHR.length === 0 ? {} : $.parseJSON(jqXHR.responseText);
            } catch (err) {
              data = {};
            }

            showAlert('danger', ('message' in data ? data.message : 'Ajax response error.') + ' - ' + uploadFile.name);
          },
          complete: function () {
            clearInterval(repeator);
            $(self).attr('disabled', false);

            // after complate
            AfterComplateUpload(5000, 10000);

            progress.delay(2000).fadeOut(500);
          }
        }); // $.ajax
      }, // function(data)
      'json'
    ); // $.post
  });
});
