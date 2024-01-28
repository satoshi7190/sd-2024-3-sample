import './style.css'; // CSSファイルのimport
// MapLibre GL JSの読み込み
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// OpacityControlプラグインの読み込み
import OpacityControl from 'maplibre-gl-opacity';
import 'maplibre-gl-opacity/dist/maplibre-gl-opacity.css';

import shelterPointData from './shelter_point.json'; // 避難所データの読み込み
import hazardLegendData from './hazard_legend.json'; // 凡例データの読み込み

// maplibre-gl-gsi-terrainの読み込み
import { useGsiTerrainSource } from 'maplibre-gl-gsi-terrain';
const gsiTerrainSource = useGsiTerrainSource(maplibregl.addProtocol);

// @mapbox/tilebeltの読み込み
import tilebelt from '@mapbox/tilebelt';

// chroma.jsの読み込み
import chroma from 'chroma-js';

// 型の読み込み
import type { Popup, RasterSourceSpecification, RasterLayerSpecification } from 'maplibre-gl';

// 凡例データの型定義
type HazardLegend = {
    id: string;
    name: string;
    guide_color: {
        color: string;
        label: string;
    }[];
};

// 地図の表示
const map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
            terrain: gsiTerrainSource, // 地形ソース
            pales: {
                // ソースの定義
                type: 'raster', // データタイプはラスターを指定
                tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'], // タイルのURL
                tileSize: 256, // タイルのサイズ
                maxzoom: 18, // 最大ズームレベル
                attribution: "<a href='https://www.gsi.go.jp/' target='_blank'>国土地理院</a>", // 地図上に表示される属性テキスト
            },
            seamlessphoto: {
                // 全国最新写真
                type: 'raster',
                tiles: ['https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'],
                tileSize: 256,
                attribution: "<a href='https://www.gsi.go.jp/' target='_blank'>国土地理院</a>",
                maxzoom: 18,
            },
            slopemap: {
                // 傾斜量図
                type: 'raster',
                tiles: ['https://cyberjapandata.gsi.go.jp/xyz/slopemap/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: "<a href='https://www.gsi.go.jp/' target='_blank'>国土地理院</a>",
                maxzoom: 15,
            },
            flood: {
                // 洪水浸水想定区域（想定最大規模）
                type: 'raster',
                tiles: ['https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png'],
                minzoom: 2,
                maxzoom: 17,
                tileSize: 256,
                attribution: "<a href='https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html' target='_blank'>ハザードマップポータルサイト</a>",
            },
            hightide: {
                // 高潮浸水想定区域
                type: 'raster',
                tiles: ['https://disaportaldata.gsi.go.jp/raster/03_hightide_l2_shinsuishin_data/{z}/{x}/{y}.png'],
                minzoom: 2,
                maxzoom: 17,
                tileSize: 256,
                attribution: "<a href='https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html' target='_blank'>ハザードマップポータルサイト</a>",
            },
            tsunami: {
                // 津波浸水想定
                type: 'raster',
                tiles: ['https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png'],
                minzoom: 2,
                maxzoom: 17,
                tileSize: 256,
                attribution: "<a href='https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html' target='_blank'>ハザードマップポータルサイト</a>",
            },
            doseki: {
                // 土砂災害警戒区域（土石流）
                type: 'raster',
                tiles: ['https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/{z}/{x}/{y}.png'],
                minzoom: 2,
                maxzoom: 17,
                tileSize: 256,
                attribution: '<a href="https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html">ハザードマップポータルサイト</a>',
            },
            kyukeisha: {
                // 土砂災害警戒区域（急傾斜地の崩壊）
                type: 'raster',
                tiles: ['https://disaportaldata.gsi.go.jp/raster/05_kyukeishakeikaikuiki/{z}/{x}/{y}.png'],
                minzoom: 2,
                maxzoom: 17,
                tileSize: 256,
                attribution: '<a href="https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html">ハザードマップポータルサイト</a>',
            },
            jisuberi: {
                // 土砂災害警戒区域（地すべり）
                type: 'raster',
                tiles: ['https://disaportaldata.gsi.go.jp/raster/05_jisuberikeikaikuiki/{z}/{x}/{y}.png'],
                minzoom: 2,
                maxzoom: 17,
                tileSize: 256,
                attribution: '<a href="https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html">ハザードマップポータルサイト</a>',
            },
            shelter: {
                type: 'geojson', // データタイプはgeojsonを指定
                data: shelterPointData,
                attribution: '<a href="https://www.bousai.metro.tokyo.lg.jp/bousai/1000026/1000316.html" target="_blank">東京都避難所、避難場所データ オープンデータ</a>',
                cluster: true, // クラスタリングの有効化
                clusterMaxZoom: 12, // クラスタリングを開始するズームレベル
                clusterRadius: 50, // クラスタリングの半径
            },
            gsi_vector: {
                // 地理院ベクトル
                type: 'vector',
                tiles: ['https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf'],
                maxzoom: 16,
                minzoom: 4,
                attribution: "<a href='https://www.gsi.go.jp/' target='_blank'>国土地理院</a>",
            },
        },
        layers: [
            {
                id: 'pales_layer', // レイヤーのID
                source: 'pales', // ソースのID
                type: 'raster', // データタイプはラスターを指定
                layout: { visibility: 'none' }, // 初期状態を非表示にする（ほかのラスターレイヤーも同様）
            },
            // 全国最新写真と傾斜量図のレイヤーを表示
            {
                id: 'seamlessphoto_layer',
                source: 'seamlessphoto',
                type: 'raster',
                layout: { visibility: 'none' },
            },
            {
                id: 'slopemap_layer',
                source: 'slopemap',
                type: 'raster',
                layout: { visibility: 'none' },
            },
            {
                id: 'background', // マスクレイヤー
                type: 'background',
                paint: {
                    'background-color': '#000', // レイヤーの色を設定
                    'background-opacity': 0.3, // 不透明度を設定
                },
            },
            {
                id: 'flood_layer', // 洪水浸水想定区域（想定最大規模）
                source: 'flood',
                type: 'raster',
                paint: { 'raster-opacity': 0.8 },
                layout: { visibility: 'none' },
            },
            {
                id: 'hightide_layer', // 高潮浸水想定区域
                source: 'hightide',
                type: 'raster',
                paint: { 'raster-opacity': 0.8 },
                layout: { visibility: 'none' },
            },
            {
                id: 'tsunami_layer', // 津波浸水想定
                source: 'tsunami',
                type: 'raster',
                paint: { 'raster-opacity': 0.8 },
                layout: { visibility: 'none' },
            },
            {
                // 土砂災害警戒区域（土石流）
                id: 'doseki_layer',
                source: 'doseki',
                type: 'raster',
                paint: { 'raster-opacity': 0.8 },
                layout: { visibility: 'none' },
            },
            {
                // 土砂災害警戒区域（急傾斜地の崩壊）
                id: 'kyukeisha_layer',
                source: 'kyukeisha',
                type: 'raster',
                paint: { 'raster-opacity': 0.8 },
                layout: { visibility: 'none' },
            },
            {
                // 土砂災害警戒区域（地すべり）
                id: 'jisuberi_layer',
                source: 'jisuberi',
                type: 'raster',
                paint: { 'raster-opacity': 0.8 },
                layout: { visibility: 'none' },
            },
            {
                id: 'building', // 建物レイヤー
                source: 'gsi_vector',
                'source-layer': 'building',
                type: 'fill-extrusion',
                minzoom: 13,
                maxzoom: 18,
                paint: {
                    'fill-extrusion-color': '#BEE6FF',
                    'fill-extrusion-height': [
                        'match', // 建物の種類によって高さを変える
                        ['get', 'ftCode'], // ftCodeで建物の種類を区別する
                        3101,
                        10, // 普通建物
                        3102,
                        40, // 堅ろう建物
                        3103,
                        100, // 高層建物
                        3111,
                        10, // 普通無壁舎
                        3112,
                        40, // 堅ろう無壁舎
                        10,
                    ], // その他
                    'fill-extrusion-opacity': 0.6,
                },
            },
            {
                id: 'clusters', // クラスター
                source: 'shelter',
                type: 'circle',
                filter: ['has', 'point_count'], // クラスターに含まれるポイントのみ表示
                paint: {
                    'circle-color': '#0BB1AF', // クラスターの色
                    'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40], // クラスターのポイント数に応じてサイズを変更
                    'circle-blur': 0.3, // クラスターのぼかし
                },
            },
            {
                id: 'cluster-count', // クラスターのポイントの数
                source: 'shelter',
                type: 'symbol',
                filter: ['has', 'point_count'], // クラスターに含まれるポイントのみ表示
                layout: {
                    'text-field': '{point_count_abbreviated}', // クラスターのポイント数を表示
                    'text-size': 12, // テキストのサイズ
                },
                paint: {
                    'text-color': '#FFF',
                },
            },
            {
                id: 'shelter_point',
                source: 'shelter',
                type: 'circle', // ポイントデータを表示するためにcircleを指定
                filter: ['!', ['has', 'point_count']], // クラスターに含まれないポイントのみ表示
                paint: {
                    'circle-color': '#0BB1AF', // ポイントの色
                    'circle-radius': 8, // ポイントのサイズ
                    'circle-stroke-width': 2, // ポイントの枠線の太さ
                    'circle-stroke-color': '#FFF', // ポイントの枠線の色
                },
            },
        ],
    },
    center: [139.477, 35.681], // 地図の中心座標
    zoom: 9, // 地図の初期ズームレベル
    maxZoom: 17.99, // 地図の最大ズームレベル
});

// 表示している災害情報レイヤーのID
let activeHazardId: string | undefined;

// ポップアップの定義
let popup: Popup | undefined;

// カラーガイドの切り替え
const updatedLegend = (layerId: string) => {
    // 表示している災害情報レイヤーのIDを更新
    activeHazardId = layerId;

    // JSONから凡例ラベルを取得
    const guideColor = hazardLegendData.find((data) => data.id === layerId)?.guide_color;
    if (!guideColor) return;

    // カラーガイドを表示する要素を取得
    const legendDiv = document.querySelector('#hazard-legend');
    if (!legendDiv) return;

    // カラーガイドを変更
    legendDiv.innerHTML = guideColor.map((item) => `<div class='label' style='background:${item.color};'>${item.label}</div>`).join('');

    // ポップアップが表示されてる場合は削除
    popup && popup.remove();
};

// マップの初期ロード完了時に発火するイベント
map.on('load', () => {
    map.addLayer(
        // hillshade レイヤー
        {
            id: 'hillshade',
            source: 'terrain', // 地形ソースを指定
            type: 'hillshade',
            paint: {
                'hillshade-illumination-anchor': 'map', // 陰影の光源は地図の北を基準にする
                'hillshade-exaggeration': 0.3, // 陰影の強さ
            },
        },
        'background', // マスクレイヤーの下に追加（対象のレイヤーidを指定する）
    );

    // 背景地図の切り替えコントロール
    const baseMaps = new OpacityControl({
        baseLayers: {
            // コントロールに表示するレイヤーの定義
            pales_layer: '淡色地図',
            seamlessphoto_layer: '空中写真',
            slopemap_layer: '傾斜量図',
        },
    });
    map.addControl(baseMaps, 'top-left'); // 第二引数でUIの表示場所を定義

    // 災害情報レイヤーの切り替えコントロール
    const hazardLayers = new OpacityControl({
        baseLayers: {
            flood_layer: '洪水浸水想定区域',
            hightide_layer: '高潮浸水想定区域',
            tsunami_layer: '津波浸水想定',
            doseki_layer: '土石流',
            kyukeisha_layer: '急傾斜地',
            jisuberi_layer: '地滑り',
        },
    });
    map.addControl(hazardLayers, 'top-left');

    // 凡例表示切り替え
    const hazardControl: HTMLInputElement = hazardLayers._container;
    hazardControl.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((radio) => {
        if (radio.checked) updatedLegend(radio.id); // 書き換え
        radio.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.checked) updatedLegend(target.id); // 書き換え
        });
    });

    // TerrainControlの追加
    map.addControl(
        new maplibregl.TerrainControl({
            source: 'terrain', // 地形ソースを指定
            exaggeration: 1, // 高さの倍率
        }),
        'top-right', // コントロールの位置を指定
    );

    // 3D切り替え
    const terrainComtrol = document.querySelector('.maplibregl-ctrl-terrain');
    terrainComtrol?.addEventListener('click', () => {
        // 地形が３D表示になっている時は地図を60度傾ける。そうでない時は0度にする。
        map.getTerrain() ? map.easeTo({ pitch: 60 }) : map.easeTo({ pitch: 0 });
    });

    // ナビゲーションコントロールの追加
    map.addControl(new maplibregl.NavigationControl({}), 'top-right'); // 画面右上に追加
});

// 凡例から最も近いラベルを取得
const getGuide = (targetColor: string, guideColors: HazardLegend['guide_color']) => {
    const closest = guideColors
        .map((item) => {
            // 各色のユークリッド距離を計算
            const distance = chroma.distance(targetColor, item.color);
            return { distance, color: item.color, label: item.label };
        })
        .sort((a, b) => a.distance - b.distance)[0]; // 距離が近い順にソートし、最初の要素を取得
    return { color: closest.color, label: closest.label };
};

// 型定義
type BBOX = [number, number, number, number];
type RGBA = [number, number, number, number];

const getPixelColor = (lng: number, lat: number, bbox: BBOX, url: string): Promise<RGBA> => {
    // クリックした座標がらタイル画像のピクセル座標を計算
    const [lngMin, latMin, lngMax, latMax] = bbox;
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 256;
    const y = ((latMax - lat) / (latMax - latMin)) * 256;

    // タイル画像を読み込み、ピクセル座標の色を返す
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pixel = ctx?.getImageData(x, y, 1, 1).data;
            if (!pixel) return;
            const [r, g, b, a] = [...pixel];
            resolve([r, g, b, a / 255]);
        };
    });
};

// 災害情報レイヤーのクリックイベント
const rasterClick = async (lng: number, lat: number) => {
    // ズームレベルを取得
    const zoom = Math.min(Math.round(map.getZoom()), 17);
    const tile = tilebelt.pointToTile(lng, lat, zoom);
    const bbox = tilebelt.tileToBBOX(tile);

    // クリックしたレイヤーのソースを取得
    const layer = map.getStyle().layers.find((layer) => layer.id === activeHazardId) as RasterLayerSpecification;
    const source = map.getSource(layer.source) as RasterSourceSpecification;
    if (!source || !source.tiles) return;

    // 地図タイルのURLを取得
    const url = source.tiles[0].replace('{z}', tile[2].toString()).replace('{x}', tile[0].toString()).replace('{y}', tile[1].toString());

    // クリックしたタイルの色を取得
    const [r, g, b, a] = await getPixelColor(lng, lat, bbox, url);

    // 透明色の場合は処理を終了
    if (a === 0) return;

    // JSONから表示中の災害情報レイヤーの凡例を取得
    const legend = hazardLegendData.find((data) => data.id === activeHazardId) as HazardLegend;

    // クリックして取得した色から一致する凡例ラベルを取得
    const guide = getGuide(`rgba(${r},${g},${b},${a})`, legend.guide_color);

    // ポップアップを表示
    const html = `<div>${legend.name}</div><h2 style='margin-bottom:0;'>${guide.label}</h2><div style='background:${guide.color}; padding:6px;'></div>`;
    popup = new maplibregl.Popup({
        offset: [0, -45],
    })
        .setLngLat([lng, lat])
        .setHTML(html)
        .addTo(map);

    // マーカーを表示
    const marker = new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);

    /// ポップアップが閉じられたときにマーカーを削除する;
    popup.on('close', () => {
        if (marker) marker?.remove();
    });
};

// マップのクリックイベント
map.on('click', (e) => {
    // 避難所の地物を取得
    const features = map.queryRenderedFeatures(e.point, { layers: ['shelter_point'] });

    if (features.length === 0) {
        // 避難所の地物がない場合は、災害情報レイヤーのクリックイベントを発火
        rasterClick(e.lngLat.lng, e.lngLat.lat);
        return;
    }

    const feature = features[0];
    if (feature.geometry.type !== 'Point') return;
    const coordinates = feature.geometry.coordinates as [number, number]; // ポイント座標

    // クリックした避難所の情報を取得
    const prop = feature.properties;
    const name = prop['避難所_施設名称']; // 名称
    const address = prop['所在地住所']; // 住所

    // バリアフリー情報を取得
    const elevation = prop['エレベーター有/\n避難スペースが１階']; // エレベーター、避難所スペース
    const slope = prop['スロープ等']; // スロープ
    const block = prop['点字ブロック']; // 点字ブロック
    const toilet = prop['車椅子使用者対応トイレ']; // トイレ
    const other = prop['その他']; // その他

    // バリアフリー情報を整形　nullの項目は表示しない
    let barrierFree = '';
    if (elevation === '○') barrierFree += '<li>エレベーター有り/避難スペースが1階</li>';
    if (slope === '○') barrierFree += '<li>スロープ等有り</li>';
    if (block === '○') barrierFree += '<li>点字ブロック有り</li>';
    if (toilet === '○') barrierFree += '<li>車椅子使用者対応トイレ有り</li>';
    if (other === '○') barrierFree += `<li>${other}</li>`;
    if (!barrierFree) barrierFree = '<li>なし</li>'; // バリアフリー情報がない場合は「なし」と表示
    const html = `<h2>${name}</h2><div>住所:${address}</div><hr /><b>バリアフリー情報</b>${barrierFree}`;

    // ポップアップを表示
    popup = new maplibregl.Popup({
        maxWidth: '300px',
        offset: [0, -15],
    })
        .setLngLat(coordinates)
        .setHTML(html)
        .addTo(map);
});

// マウスカーソルのスタイルを変更
map.on('mouseenter', 'shelter_point', () => (map.getCanvas().style.cursor = 'pointer'));
map.on('mouseleave', 'shelter_point', () => (map.getCanvas().style.cursor = ''));
