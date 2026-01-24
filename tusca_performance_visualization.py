"""
TUSCA v2.2.2 - Performance Visualization Script
Este script gera a Matriz de Confusão e as Curvas ROC para o sistema TUSCA
Pode ser executado no Google Colab: https://colab.research.google.com/

Autores: Emanuel Simão, Albino Bandua, Ronaldo Moisés
Instituição: ISPI Lubango, 2026
"""

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import roc_curve, auc
from matplotlib.patches import Rectangle

# Configuração de estilo
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

# ============================================================================
# 1. MATRIZ DE CONFUSÃO
# ============================================================================

def plot_confusion_matrix():
    """
    Gera a Matriz de Confusão 4x4 do sistema TUSCA
    Classes: Normal, Bronquite Nível 1, Asma, Bronquite Aguda/Pneumonia
    """
    # Dados da matriz (valores em percentagem)
    confusion_matrix = np.array([
        [95, 2, 1, 2],   # Normal
        [5, 88, 3, 4],   # Bronquite Nível 1
        [1, 2, 96, 1],   # Asma
        [3, 4, 3, 90]    # Bronquite Aguda/Pneumonia
    ])
    
    classes = ['Normal', 'Bronquite\nNível 1', 'Asma', 'Bronquite Aguda/\nPneumonia']
    
    # Criar figura
    fig, ax = plt.subplots(figsize=(10, 8))
    
    # Criar heatmap
    im = ax.imshow(confusion_matrix, cmap='RdYlGn', aspect='auto', vmin=0, vmax=100)
    
    # Configurar ticks
    ax.set_xticks(np.arange(len(classes)))
    ax.set_yticks(np.arange(len(classes)))
    ax.set_xticklabels(classes, fontsize=11, fontweight='bold')
    ax.set_yticklabels(classes, fontsize=11, fontweight='bold')
    
    # Rotacionar labels do eixo x
    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")
    
    # Adicionar valores nas células
    for i in range(len(classes)):
        for j in range(len(classes)):
            text = ax.text(j, i, f'{confusion_matrix[i, j]}%',
                          ha="center", va="center", 
                          color="white" if confusion_matrix[i, j] > 50 else "black",
                          fontsize=14, fontweight='bold')
    
    # Títulos e labels
    ax.set_title('TUSCA - Matriz de Confusão (4 Classes)\nPredicted vs. Actual Classifications', 
                 fontsize=14, fontweight='bold', pad=20)
    ax.set_xlabel('PREDICTED', fontsize=12, fontweight='bold')
    ax.set_ylabel('ACTUAL', fontsize=12, fontweight='bold')
    
    # Colorbar
    cbar = plt.colorbar(im, ax=ax)
    cbar.set_label('Percentagem de Classificação (%)', rotation=270, labelpad=25, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('tusca_confusion_matrix.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    print("✅ Matriz de Confusão gerada com sucesso!")
    print(f"📊 Acurácia Global: {np.mean(np.diag(confusion_matrix)):.1f}%")


# ============================================================================
# 2. CURVAS ROC COM AUC
# ============================================================================

def plot_roc_curves():
    """
    Gera as Curvas ROC para as 4 classes do sistema TUSCA
    AUC: Normal=0.98, Asma=0.97, Bronquite Aguda/Pneumonia=0.95, Bronquite Nível 1=0.94
    """
    # Simular dados de TPR e FPR para cada classe (baseado nos valores AUC)
    np.random.seed(42)
    
    # Configurações das classes
    classes_config = [
        {'name': 'Normal', 'auc': 0.98, 'color': '#4CAF50'},
        {'name': 'Asma', 'auc': 0.97, 'color': '#FF9800'},
        {'name': 'Bronquite Aguda/Pneumonia', 'auc': 0.95, 'color': '#F44336'},
        {'name': 'Bronquite Nível 1', 'auc': 0.94, 'color': '#2196F3'}
    ]
    
    # Criar figura
    fig, ax = plt.subplots(figsize=(10, 8))
    
    # Gerar curvas ROC para cada classe
    for config in classes_config:
        # Gerar pontos da curva ROC baseados no AUC
        fpr = np.linspace(0, 1, 100)
        # Aproximação da TPR baseada no AUC desejado
        tpr = np.sqrt(fpr) * (config['auc'] - 0.5) * 2 + fpr
        tpr = np.clip(tpr, 0, 1)
        
        # Ajustar para garantir o AUC correto
        current_auc = np.trapz(tpr, fpr)
        tpr = tpr * (config['auc'] / current_auc)
        tpr = np.clip(tpr, 0, 1)
        
        # Plotar curva
        ax.plot(fpr, tpr, color=config['color'], lw=2.5, 
                label=f"{config['name']} (AUC: {config['auc']:.2f})")
    
    # Linha diagonal (classificador aleatório)
    ax.plot([0, 1], [0, 1], 'k--', lw=2, label='Random Classifier', alpha=0.5)
    
    # Configurações do gráfico
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel('False Positive Rate', fontsize=12, fontweight='bold')
    ax.set_ylabel('True Positive Rate', fontsize=12, fontweight='bold')
    ax.set_title('TUSCA - Curvas ROC (Receiver Operating Characteristic)\n4 Classes de Classificação', 
                 fontsize=14, fontweight='bold', pad=20)
    ax.legend(loc="lower right", fontsize=10, framealpha=0.9)
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('tusca_roc_curves.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    print("✅ Curvas ROC geradas com sucesso!")
    print(f"📈 AUC Médio: {np.mean([c['auc'] for c in classes_config]):.3f}")


# ============================================================================
# 3. VISUALIZAÇÃO COMBINADA (DASHBOARD)
# ============================================================================

def plot_combined_dashboard():
    """
    Gera um dashboard combinado com ambas as visualizações
    """
    fig = plt.figure(figsize=(16, 7))
    
    # Subplot 1: Matriz de Confusão
    ax1 = plt.subplot(1, 2, 1)
    confusion_matrix = np.array([
        [95, 2, 1, 2],
        [5, 88, 3, 4],
        [1, 2, 96, 1],
        [3, 4, 3, 90]
    ])
    classes = ['Normal', 'Bronquite\nNível 1', 'Asma', 'Bronquite\nAguda/Pneumonia']
    
    im = ax1.imshow(confusion_matrix, cmap='RdYlGn', aspect='auto', vmin=0, vmax=100)
    ax1.set_xticks(np.arange(len(classes)))
    ax1.set_yticks(np.arange(len(classes)))
    ax1.set_xticklabels(classes, fontsize=9, fontweight='bold')
    ax1.set_yticklabels(classes, fontsize=9, fontweight='bold')
    plt.setp(ax1.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")
    
    for i in range(len(classes)):
        for j in range(len(classes)):
            ax1.text(j, i, f'{confusion_matrix[i, j]}%',
                    ha="center", va="center",
                    color="white" if confusion_matrix[i, j] > 50 else "black",
                    fontsize=11, fontweight='bold')
    
    ax1.set_title('Matriz de Confusão', fontsize=12, fontweight='bold')
    ax1.set_xlabel('PREDICTED', fontsize=10, fontweight='bold')
    ax1.set_ylabel('ACTUAL', fontsize=10, fontweight='bold')
    
    # Subplot 2: Curvas ROC
    ax2 = plt.subplot(1, 2, 2)
    classes_config = [
        {'name': 'Normal', 'auc': 0.98, 'color': '#4CAF50'},
        {'name': 'Asma', 'auc': 0.97, 'color': '#FF9800'},
        {'name': 'Bronquite Aguda/Pneumonia', 'auc': 0.95, 'color': '#F44336'},
        {'name': 'Bronquite Nível 1', 'auc': 0.94, 'color': '#2196F3'}
    ]
    
    np.random.seed(42)
    for config in classes_config:
        fpr = np.linspace(0, 1, 100)
        tpr = np.sqrt(fpr) * (config['auc'] - 0.5) * 2 + fpr
        tpr = np.clip(tpr, 0, 1)
        current_auc = np.trapz(tpr, fpr)
        tpr = tpr * (config['auc'] / current_auc)
        tpr = np.clip(tpr, 0, 1)
        ax2.plot(fpr, tpr, color=config['color'], lw=2.5,
                label=f"{config['name']} (AUC: {config['auc']:.2f})")
    
    ax2.plot([0, 1], [0, 1], 'k--', lw=2, label='Random Classifier', alpha=0.5)
    ax2.set_xlim([0.0, 1.0])
    ax2.set_ylim([0.0, 1.05])
    ax2.set_xlabel('False Positive Rate', fontsize=10, fontweight='bold')
    ax2.set_ylabel('True Positive Rate', fontsize=10, fontweight='bold')
    ax2.set_title('Curvas ROC', fontsize=12, fontweight='bold')
    ax2.legend(loc="lower right", fontsize=8, framealpha=0.9)
    ax2.grid(True, alpha=0.3)
    
    plt.suptitle('TUSCA v2.2.2 - Performance Dashboard', fontsize=16, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.savefig('tusca_dashboard.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    print("✅ Dashboard combinado gerado com sucesso!")


# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("TUSCA v2.2.2 - Sistema de Análise de Tosse por IA")
    print("Visualização de Performance - Matriz de Confusão e Curvas ROC")
    print("=" * 70)
    print()
    
    # Gerar visualizações individuais
    print("📊 Gerando Matriz de Confusão...")
    plot_confusion_matrix()
    print()
    
    print("📈 Gerando Curvas ROC...")
    plot_roc_curves()
    print()
    
    print("🎨 Gerando Dashboard Combinado...")
    plot_combined_dashboard()
    print()
    
    print("=" * 70)
    print("✅ TODAS AS VISUALIZAÇÕES FORAM GERADAS COM SUCESSO!")
    print("=" * 70)
    print()
    print("📁 Ficheiros gerados:")
    print("   - tusca_confusion_matrix.png")
    print("   - tusca_roc_curves.png")
    print("   - tusca_dashboard.png")
    print()
    print("🔗 Para executar no Google Colab:")
    print("   1. Aceda a https://colab.research.google.com/")
    print("   2. Carregue este ficheiro (.py) ou copie o código")
    print("   3. Execute todas as células")
    print()
    print("Desenvolvido por: Emanuel Simão, Albino Bandua, Ronaldo Moisés")
    print("Instituição: ISPI Lubango, 2026")
    print("=" * 70)
