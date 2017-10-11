# Kollus Custom Upload By Ruby

Upload media by Kollus Http-endpoint API : Sample Source

## Requirement

* [ruby](https://www.ruby-lang.org/) : 2.0 above
   * module
      * [sinatra](http://www.sinatrarb.com/) : for sample code's web framework
      * [sinatra-contrib](http://www.sinatrarb.com/contrib/)
* [jQuery](https://jquery.com) : 3.2.1
   * [Kollus Custom Upload By jQuery](https://github.com/kollus-service/kollus-custom-upload-jquery) library
* [Boostrap](https://getbootstrap.com/docs/3.3/) : for sample code
  
## Installation

```bash
git clone https://github.com/kollus-service/kollus-custom-upload-ruby
cd kollus-custom-upload-ruby

bundle install
```
Copy .config.yml to config.yml and Edit this.

```yaml
kollus:
  domain: [kollus domain]
  version: 0
  service_account:
    key : [service account key]
    api_access_token: [api access token]
    custom_key: [custom key]
    security_key: [security_key]
```

## How to use

```bash
ruby app.rb

...
[2017-08-17 17:00:09] INFO  WEBrick 1.3.1
[2017-08-17 17:00:09] INFO  ruby 2.4.1 (2017-03-22) [x86_64-darwin16]
== Sinatra (v2.0.0) has taken the stage on 4567 for development with backup from WEBrick
[2017-08-17 17:00:09] INFO  WEBrick::HTTPServer#start: pid=34312 port=4567
```

Open browser '[http://localhost:4567](http://localhost:4567)'

## You must use modern browser

* IE 10 above and other latest browser is best
* Don't use 'iframe upload' and 'kollus progress api'

## Development flow
1. Request local server api for create 'upload url' on browser
   * '/api/upload/create_url' in app.rb 
2. Local server call kollus api and create 'kollus upload url'
   * use upload_url_response in lib/kollus_api_client.rb
3. Upload file to 'kollus upload url'
   * use upload-file event in public/js/default.js

### Important code

app.rb

```ruby
post '/api/upload/create_url' do
  # @type [KollusApiClient] kollus_api_client
  kollus_api_client = settings.kollus_api_client
  data = kollus_api_client.upload_url_response(
    category_key: params['category_key'],
    use_encryption: params['use_encryption'],
    is_audio_upload: params['is_audio_upload']
  )
  content_type :json, 'charset' => 'utf-8'
  data.to_json
end
```

lib/kollus_api_client.rb

```ruby
  # upload_url_response
  #
  # @param [String] category_key
  # @param [Boolean] use_encryption
  # @param [Boolean] is_audio_upload
  # @param [String] title
  # @return [Hash]
  def upload_url_response(
    category_key: nil,
    use_encryption: 0,
    is_audio_upload: 0,
    title: nil
  )
    post_params = {
      access_token: @service_account.api_access_token,
      category_key: category_key,
      is_encryption_upload: use_encryption,
      is_audio_upload: is_audio_upload,
      expire_time: 600,
      title: title
    }
    res = Net::HTTP.post_form(
      URI(api_url('media_auth/upload/create_url')),
      post_params
    )
    JSON.parse(res.body)
  end
```

public/js/default.js

```javascript
/**
 * Kollus Upload JS by JQuery
 *
 * Upload event handler
 */
$(document).on('click', 'button[data-action=upload-file]', function (e) {
        ...
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
                            ... // only modern browser
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
        ...
});
```

# License

Seee LICENSE for more information