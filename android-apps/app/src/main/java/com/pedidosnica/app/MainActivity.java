package com.pedidosnica.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {

    private static final String PREFS_NAME = "PedidosNicaPrefs";
    private static final String KEY_CUSTOM_SERVER = "custom_server_url";

    private WebView webView;
    private TextView statusBadge;
    private SharedPreferences prefs;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(Color.parseColor("#000000"));
            getWindow().setNavigationBarColor(Color.parseColor("#000000"));
        }

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#000000"));

        // Barra superior nativa con versión, estado y verificador de actualizaciones
        LinearLayout topBar = new LinearLayout(this);
        topBar.setOrientation(LinearLayout.HORIZONTAL);
        topBar.setGravity(Gravity.CENTER_VERTICAL);
        topBar.setBackgroundColor(Color.parseColor("#0E1117"));
        int padH = dp(12);
        int padV = dp(7);
        topBar.setPadding(padH, padV, padH, padV);

        TextView titleView = new TextView(this);
        titleView.setText(BuildConfig.APP_ROLE_TITLE + " • v" + BuildConfig.VERSION_NAME);
        titleView.setTextColor(Color.parseColor("#06C167"));
        titleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        titleView.setTypeface(Typeface.DEFAULT_BOLD);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        topBar.addView(titleView, titleParams);

        statusBadge = new TextView(this);
        statusBadge.setText("App Local Activa");
        statusBadge.setTextColor(Color.parseColor("#A6A6A6"));
        statusBadge.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10);
        statusBadge.setPadding(dp(6), dp(2), dp(8), dp(2));
        statusBadge.setVisibility(View.GONE);
        topBar.addView(statusBadge);

        TextView btnUpdate = makePillButton("Actualizar", "#06C167", "#000000");
        btnUpdate.setOnClickListener(v -> checkForGitHubUpdate(true));
        topBar.addView(btnUpdate);

        View spacer = new View(this);
        topBar.addView(spacer, new LinearLayout.LayoutParams(dp(6), dp(1)));

        TextView btnServer = makePillButton("Red", "#1E2532", "#FFFFFF");
        btnServer.setOnClickListener(v -> showServerConfigDialog());
        topBar.addView(btnServer);

        root.addView(topBar, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        ));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#000000"));
        setupWebView();

        root.addView(webView, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f
        ));

        setContentView(root);

        requestLocationPermissionsIfNeeded();
        loadBundledOrCustomApp();
        checkForGitHubUpdate(false);
    }

    private TextView makePillButton(String text, String bgHex, String fgHex) {
        TextView tv = new TextView(this);
        tv.setText(text);
        tv.setTextColor(Color.parseColor(fgHex));
        tv.setBackgroundColor(Color.parseColor(bgHex));
        tv.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        tv.setTypeface(Typeface.DEFAULT_BOLD);
        tv.setPadding(dp(10), dp(4), dp(10), dp(4));
        return tv;
    }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                value,
                getResources().getDisplayMetrics()
        );
    }

    @SuppressWarnings("deprecation")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setLoadWithOverviewMode(false);
        settings.setUseWideViewPort(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMediaPlaybackRequiresUserGesture(false);
        webView.setHorizontalScrollBarEnabled(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        }

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.endsWith(".apk") || url.contains("github.com/darthriuk/PedidosNica/releases")) {
                    Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(i);
                    return true;
                }
                return false;
            }
        });
    }

    private void requestLocationPermissionsIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                }, 1001);
            }
        }
    }

    private void loadBundledOrCustomApp() {
        String custom = prefs.getString(KEY_CUSTOM_SERVER, "");
        if (custom != null && !custom.trim().isEmpty()) {
            String clean = custom.trim().replaceAll("/+$", "");
            statusBadge.setText("Servidor: " + clean);
            webView.loadUrl(clean + BuildConfig.PORTAL_PATH);
            return;
        }
        // Cargar instantáneamente el Build Local empaquetado dentro del APK (0 errores de túnel)
        statusBadge.setText("Build Local Activo");
        webView.loadUrl(BuildConfig.ASSET_HTML);
    }

    private void checkForGitHubUpdate(boolean manualTrigger) {
        if (manualTrigger) {
            Toast.makeText(this, "Buscando actualizaciones en GitHub...", Toast.LENGTH_SHORT).show();
        }
        new Thread(() -> {
            try {
                String apiUrl = "https://api.github.com/repos/" + BuildConfig.GITHUB_REPO + "/releases/latest";
                String response = httpGet(apiUrl, 5000);
                if (response == null) {
                    if (manualTrigger) {
                        mainHandler.post(() -> Toast.makeText(MainActivity.this, "No se pudo consultar GitHub Releases.", Toast.LENGTH_SHORT).show());
                    }
                    return;
                }

                JSONObject release = new JSONObject(response);
                String tagName = release.optString("tag_name", "").replaceFirst("^v", "");
                String body = release.optString("body", "Mejoras de rendimiento y nuevas funciones en PedidosNica.");
                String downloadUrl = "https://github.com/" + BuildConfig.GITHUB_REPO + "/releases/latest/download/" + BuildConfig.APK_ASSET_NAME;

                JSONArray assets = release.optJSONArray("assets");
                if (assets != null) {
                    for (int i = 0; i < assets.length(); i++) {
                        JSONObject asset = assets.getJSONObject(i);
                        if (BuildConfig.APK_ASSET_NAME.equalsIgnoreCase(asset.optString("name"))) {
                            downloadUrl = asset.optString("browser_download_url", downloadUrl);
                            break;
                        }
                    }
                }

                final String finalDownloadUrl = downloadUrl;
                final boolean isNewer = !tagName.isEmpty() && !tagName.equals(BuildConfig.VERSION_NAME);

                mainHandler.post(() -> {
                    if (isNewer) {
                        new AlertDialog.Builder(MainActivity.this)
                                .setTitle("🚀 Nueva Actualización Disponible (v" + tagName + ")")
                                .setMessage("Versión instalada: v" + BuildConfig.VERSION_NAME + "\nNueva versión: v" + tagName + "\n\nNotas:\n" + body)
                                .setPositiveButton("Descargar e Instalar APK", (d, w) -> {
                                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(finalDownloadUrl));
                                    startActivity(intent);
                                })
                                .setNegativeButton("Más tarde", null)
                                .show();
                    } else if (manualTrigger) {
                        new AlertDialog.Builder(MainActivity.this)
                                .setTitle("✅ Aplicación Actualizada")
                                .setMessage("Tienes instalada la versión más reciente (v" + BuildConfig.VERSION_NAME + ") de " + BuildConfig.APP_ROLE_TITLE + ".")
                                .setPositiveButton("Recargar Vista", (d, w) -> loadBundledOrCustomApp())
                                .setNeutralButton("Re-descargar APK", (d, w) -> {
                                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(finalDownloadUrl));
                                    startActivity(intent);
                                })
                                .setNegativeButton("Cerrar", null)
                                .show();
                    }
                });
            } catch (Exception e) {
                if (manualTrigger) {
                    mainHandler.post(() -> Toast.makeText(MainActivity.this, "Error al verificar actualización.", Toast.LENGTH_SHORT).show());
                }
            }
        }).start();
    }

    private void showServerConfigDialog() {
        final String currentCustom = prefs.getString(KEY_CUSTOM_SERVER, "");

        LinearLayout container = new LinearLayout(this);
        container.setOrientation(LinearLayout.VERTICAL);
        int p = dp(16);
        container.setPadding(p, p, p, p);

        final EditText input = new EditText(this);
        input.setHint("Opcional: http://192.168.1.20:3000 (vacío = Build Local)");
        input.setText(currentCustom);
        input.setSingleLine(true);
        container.addView(input);

        new AlertDialog.Builder(this)
                .setTitle("Modo de Ejecución de la App")
                .setMessage("La app incluye el Build Local completo empaquetado adentro y sincroniza con tu red local automáticamente cuando está disponible.")
                .setView(container)
                .setPositiveButton("Usar Build Local (Recomendado)", (d, w) -> {
                    prefs.edit().remove(KEY_CUSTOM_SERVER).apply();
                    loadBundledOrCustomApp();
                })
                .setNeutralButton("Conectar a IP ingresada", (d, w) -> {
                    String val = input.getText().toString().trim();
                    prefs.edit().putString(KEY_CUSTOM_SERVER, val).apply();
                    loadBundledOrCustomApp();
                })
                .setNegativeButton("Cancelar", null)
                .show();
    }

    private String httpGet(String urlStr, int timeoutMs) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlStr);
            conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(timeoutMs);
            conn.setReadTimeout(timeoutMs);
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/vnd.github+json");
            conn.setRequestProperty("User-Agent", "PedidosNica-Android-Updater");
            int code = conn.getResponseCode();
            if (code >= 200 && code < 300) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append("\n");
                }
                reader.close();
                return sb.toString();
            }
        } catch (Exception ignored) {
        } finally {
            if (conn != null) conn.disconnect();
        }
        return null;
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
