javascript:(function() {
  const host = location.host;
  const urlList = []; // 取得したページリストの格納先
  let pageCounter = 0; // 現在取得中のページ番号を管理

  /**
   * 指定したページの情報取得
   * @param {string} pageUrl - 取得するページURL
   */
  const get_pagedata = async (pageUrl) => {
    // カウントの更新
    update_counter();
    // ページ情報の取得
    const result = await fetch(pageUrl);
    const text = await result.text();
    // ページ情報取得成功時
    if(result.ok) {
      // documentオブジェクトに変換
      let parser = new DOMParser();
      let doc = parser.parseFromString(text, 'text/html');
      // ページリスト内のステータスとタイトル更新
      urlList[pageCounter].status = result.status;
      urlList[pageCounter].title = doc.title;
      // ページ内にあるリンクURLをページリストに追加
      get_linklist(doc);
      console.log('URL:', pageUrl, 'COUNT:', (pageCounter+1)+'/'+urlList.length, 'TITLE:', doc.title, 'STATUS:', result.status);
    // ページ情報取得失敗時
    } else {
      // ページリスト内のステータス更新
      urlList[pageCounter].status = result.status;
      console.log('URL:', pageUrl, 'COUNT:', (pageCounter+1)+'/'+urlList.length, 'STATUS:', result.status);
    }
    // ページ番号の更新
    pageCounter++;
    // 全てのページリストをチェックし終わった場合、結果を出力
    if(pageCounter >= urlList.length) {
      generate_result();
      return;
    }
    // 次のページのチェックを実行
    setTimeout(function() {
      get_pagedata(urlList[pageCounter]['url']);
    }, 1000);
  };

  /**
   * ページ情報に含まれるリンクURLをページリストに追加
   * @param {object} doc - ページのdocumentオブジェクト
   */
  const get_linklist = (doc) => {
    // ページ内にあるリンクを取得
    const links = doc.querySelectorAll('a');
    for (let i = 0; i < links.length; i++) {
      // リンクのURLを調整して取得
      const link = adjust_link(links[i]);
      // URLがページリストに含まれない かつ 外部ドメインでない場合、ページリストに追加
      if(!search_urlList(link) && link.indexOf(host) > -1) {
        urlList.push({
          title: '',
          url: link,
          status: ''
        });
        // カウントの更新
        update_counter();
      }
    }
  };

  /**
   * aタグ内のリンクを調整
   * @param {object} a - aタグのオブジェクト
   */
  const adjust_link = (a) => {
    let href = a.getAttribute('href');
    // href未設定の場合は空として扱う
    if(href === null) {
      href = '';
    // メーラー・電話の設定の場合は空として扱う
    } else if(href.slice(0, 7) === 'mailto:' || href.slice(0, 4) === 'tel:') {
      href = '';
    }
    // URLオブジェクトの生成
    const url = new URL(href, urlList[pageCounter].url);
    return adjust_url(url.href);
  };

  /**
   * URLの調整
   * @param {object} url - URLオブジェクト
   */
  const adjust_url = (url) => {
    // ハッシュとパラメータの除去
    let adjustUrl = url.split('#')[0].split('?')[0];
    const dirs = adjustUrl.split('/');
    const lastDir = dirs[dirs.length-1];
    // URLがスラッシュで終わっていない場合
    if(lastDir !== '') {
      // URLにファイル名が含まれていない場合は末尾にスラッシュを追加
      if(lastDir.indexOf('.') === -1) {
        adjustUrl = adjustUrl + '/';
      } else {
        // ファイル名がindex.htmlの場合は省略
        adjustUrl = adjustUrl.replace('index.html', '');
      }
    }
    return adjustUrl;
  };

  /**
   * URLリストに指定したURLが含まれるかどうか検索
   * @param {object} url - URL
   */
  const search_urlList = (url) => {
    for (let i = 0; i < urlList.length; i++) {
      if(urlList[i].url === url) return true;
    }
    return false;
  };

  /**
   * カウントの更新
   */
  const update_counter = () => {
    const current = document.getElementById('pagelist-generator-counter-current');
    const total = document.getElementById('pagelist-generator-counter-total');
    current.innerText = pageCounter + 1;
    total.innerText = urlList.length;
  };

  /**
   * 操作バーの表示
   */
  const generate_controller = () => {
    const bar = document.createElement('div');
    const barStyle = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      background: black;
    `;
    bar.setAttribute('style', barStyle);
    const counterStyle = `
      color: white;
      padding: 10px;
    `;
    const counter = `
      <div style="${counterStyle}">
        <span id="pagelist-generator-counter-current">0</span>
        <span>/</span>
        <span id="pagelist-generator-counter-total">0</span>
      </div>
    `;
    bar.innerHTML = counter;
    document.body.appendChild(bar);
  };

  /**
   * 最終結果の表示
   */
  const generate_result = () => {
    console.table(urlList);
    let res = '';
    let c = 0;
    for (let i = 0; i < urlList.length; i++) {
      // ステータスが200番台の場合のみ出力結果に含める
      if(200 <= urlList[i].status && urlList[i].status <= 299) {
        res += urlList[i].title + '	' + urlList[i].url + '\n';
        c++;
      }
    }
    console.log(c+'件のURLを取得しました');
    console.log(res);
  };

  // 処理の実行開始
  urlList.push({
    title: document.title,
    url: adjust_url(location.href),
    status: ''
  });
  generate_controller();
  get_pagedata(urlList[pageCounter]['url']);
})()