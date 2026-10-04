import { useState } from "react";
import { jsPDF } from "jspdf";
import { FaCheck, FaEdit, FaFilePdf, FaTrash } from "react-icons/fa";
import { FaPaperPlane } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import "jspdf-autotable";
import "./App.css";

const PDFGenerator = () => {
  const [customerData, setCustomerData] = useState({
    name: "",
    cnpj: "",
    phone: "",
  });
  const [items, setItems] = useState([]);
  const [itemDescription, setItemDescription] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemColor, setItemColor] = useState("");
  const [observations, setObservations] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [includePaymentDetails, setIncludePaymentDetails] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [editingIndex, setEditingIndex] = useState(-1);

  const handleCustomerDataChange = (e) => {
    const { name, value } = e.target;
    setCustomerData({ ...customerData, [name]: value });
  };

  const handleItemNameChange = (e) => {
    setItemDescription(e.target.value);
  };

  const handleItemQuantityChange = (e) => {
    setItemQuantity(e.target.value);
  };

  const handleItemPriceChange = (e) => {
    setItemColor(e.target.value);
  };

  const handleObservationsChange = (e) => {
    setObservations(e.target.value);
  };

  const handleTotalAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setTotalAmount(formatCurrency(value));
  };

  const formatCurrency = (value) => {
    const amount = parseFloat(value) / 100;
    return `R$ ${amount
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const handleDateChange = (e) => {
    const selectedDateStr = e.target.value;
    setDate(selectedDateStr);
  };

  const formatPhone = (value) => {
    const phoneNumber = value.replace(/\D/g, "");
    if (phoneNumber.length === 11) {
      return phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return phoneNumber.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  };

  const formatCnpjCpf = (value) => {
    const cnpjCpf = value.replace(/\D/g, "");
    if (cnpjCpf.length === 14) {
      return cnpjCpf.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      );
    } else if (cnpjCpf.length === 11) {
      return cnpjCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value;
  };

  const addItem = () => {
    const newItem = {
      description: itemDescription,
      quantity: itemQuantity ? parseInt(itemQuantity) : "",
      color: itemColor,
    };
    setItems([...items, newItem]);
    clearInputs();
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const currentDate = date;
    const [year, month, day] = currentDate.split("-");

    const formattedDate = `${day}/${month}/${year}`;

    // Header
    doc.setFillColor(0, 152, 219);
    doc.rect(0, 0, 210, 35, "F");
    doc.setFont("Montserrat", "bold");
    doc.setFontSize(27);
    doc.setTextColor(255);
    doc.text("Vidraçaria Ambires", 18, 17);

    doc.setFont("Montserrat", "normal");

    // Data atual
    doc.setFontSize(14);
    doc.setTextColor(255);
    doc.text(`Data: ${formattedDate}`, 20, 25);

    // Dados fixos e dinâmicos
    // Adicionar os dados fixos na coluna esquerda
    doc.setTextColor(0);
    doc.text(`Nome: Daniel Ambires da Silva`, 20, 50);
    doc.text(`CNPJ: 68.536.892/0001-83`, 20, 60);
    doc.text(`Telefone: (11) 94705-8537`, 20, 70);

    if (customerData.name || customerData.cnpj || customerData.phone) {
      doc.setLineWidth(1);
      doc.setDrawColor(204, 204, 204);
      doc.line(105, 45, 105, 80);
    }

    // Adicionar os dados dinâmicos na coluna direita
    const yPosCustomerDataNome = 50;
    const yPosCustomerDataCNPJ = 64;
    const yPosCustomerDataPhone = 74;

    if (customerData.name) {
      const maxWidth = 80;
      const customerNameLines = doc.splitTextToSize(
        `Nome: ${customerData.name}`,
        maxWidth
      );
      doc.text(customerNameLines, 120, yPosCustomerDataNome);
    }
    if (customerData.cnpj) {
      doc.text(
        `CNPJ/CPF: ${formatCnpjCpf(customerData.cnpj)}`,
        120,
        yPosCustomerDataCNPJ
      );
    }
    if (customerData.phone) {
      doc.text(
        `Telefone: ${formatPhone(customerData.phone)}`,
        120,
        yPosCustomerDataPhone
      );
    }

    // Tabela de Itens
    const tableData = items.map((item) => [
      {
        content: item.description,
        styles: { valign: "top", halign: "left" },
      },
      item.quantity,
      item.color,
    ]);
    doc.autoTable({
      startY: yPosCustomerDataPhone + 10,
      head: [["Descrição", "Quantidade", "Cor"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [0, 152, 219],
      },
    });

    // Rodapé
    const startYFooter = Math.max(doc.autoTable.previous.finalY + 20);
    let totalAmountY = startYFooter + 15;

    if (observations) {
      const observationLines = doc.splitTextToSize(
        `Observações: ${observations}`,
        170
      );
      doc.text(observationLines, 20, startYFooter);

      const lineHeight = doc.getLineHeight() / doc.internal.scaleFactor;
      totalAmountY = startYFooter + observationLines.length * lineHeight + 8;
    }

    const paymentCardHeight = 55;
    const pageHeight = doc.internal.pageSize.getHeight();
    if (
      includePaymentDetails &&
      totalAmountY + 10 + paymentCardHeight > pageHeight - 20
    ) {
      doc.addPage();
      totalAmountY = 20;
    }
    doc.text(`Valor Total: ${totalAmount}`, 20, totalAmountY);

    if (includePaymentDetails) {
      const paymentCardX = 20;
      const paymentCardY = totalAmountY + 10;
      const paymentCardWidth = 170;
      const paymentCardPadding = 6;

      doc.setFillColor(247, 251, 253);
      doc.setDrawColor(190, 220, 233);
      doc.roundedRect(
        paymentCardX,
        paymentCardY,
        paymentCardWidth,
        paymentCardHeight,
        2,
        2,
        "FD"
      );
      doc.setFillColor(0, 152, 219);
      doc.roundedRect(
        paymentCardX,
        paymentCardY,
        paymentCardWidth,
        10,
        2,
        2,
        "F"
      );

      doc.setTextColor(255);
      doc.setFont("Montserrat", "bold");
      doc.setFontSize(10);
      doc.text("FORMAS DE PAGAMENTO", paymentCardX + paymentCardPadding, paymentCardY + 6.5);

      doc.setTextColor(0);
      doc.setFont("Montserrat", "normal");
      doc.setFontSize(9);
      doc.text(
        "Titular: Vidraçaria Ambires  |  CNPJ: 68.536.892/0001-83",
        paymentCardX + paymentCardPadding,
        paymentCardY + 17
      );

      doc.setTextColor(0, 102, 153);
      doc.setFont("Montserrat", "bold");
      doc.text(
        "TRANSFERÊNCIA BANCÁRIA",
        paymentCardX + paymentCardPadding,
        paymentCardY + 26
      );
      doc.setTextColor(0);
      doc.setFont("Montserrat", "normal");
      doc.text(
        "Banco: Cora Scfi 403  |  Agência: 0001  |  Conta: 7685143-6",
        paymentCardX + paymentCardPadding,
        paymentCardY + 32
      );

      doc.setDrawColor(190, 220, 233);
      doc.line(
        paymentCardX + paymentCardPadding,
        paymentCardY + 37,
        paymentCardX + paymentCardWidth - paymentCardPadding,
        paymentCardY + 37
      );
      doc.setTextColor(0, 102, 153);
      doc.setFont("Montserrat", "bold");
      doc.text("PIX PARA TRANSFERÊNCIA", paymentCardX + paymentCardPadding, paymentCardY + 44);
      doc.setTextColor(0);
      doc.setFont("Montserrat", "normal");
      doc.text("Chave Pix (CNPJ):", paymentCardX + paymentCardPadding, paymentCardY + 51);
      const pixLabelWidth = doc.getTextWidth("Chave Pix (CNPJ):");
      doc.setFont("Montserrat", "bold");
      doc.setFontSize(11);
      doc.text(
        "68536892000183",
        paymentCardX + paymentCardPadding + pixLabelWidth + 3,
        paymentCardY + 51
      );
      doc.setFontSize(14);
    }

    doc.save(`orcamento${currentDate}.pdf`);
  };

  const editItem = (index) => {
    const selectedItem = items[index];
    setItemDescription(selectedItem.description);
    setItemQuantity(selectedItem.quantity.toString());
    setItemColor(selectedItem.color);
    setEditingIndex(index);
  };

  const saveItem = () => {
    const updatedItems = [...items];
    updatedItems[editingIndex] = {
      description: itemDescription,
      quantity: parseInt(itemQuantity),
      color: itemColor,
    };
    setItems(updatedItems);
    clearInputs();
    setEditingIndex(-1);
  };

  const cancelEdit = () => {
    clearInputs();
    setEditingIndex(-1);
  };

  const clearInputs = () => {
    setItemDescription("");
    setItemQuantity("");
    setItemColor("");
  };

  const deleteItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  return (
    <div className="app">
      <header className="navbar">
        <div className="header-content">
          <div className="brand-mark" aria-hidden="true">VA</div>
          <div>
            <h1>Vidraçaria Ambires</h1>
            <p>Gerador de orçamentos</p>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="page-intro">
          <span className="eyebrow">Novo orçamento</span>
          <h2>Monte uma proposta clara e profissional.</h2>
          <p>Preencha os dados abaixo e gere o PDF quando estiver pronto.</p>
        </div>

        <section className="form-card date-card">
          <div className="section-heading">
            <div>
              <h2>Data do orçamento</h2>
              <p>Escolha a data que aparecerá no documento.</p>
            </div>
          </div>
          <label className="field date-field" htmlFor="budget-date">
            <span>Data</span>
            <input
              id="budget-date"
              type="date"
              value={date}
              onChange={handleDateChange}
              required
            />
          </label>
        </section>

        <section className="form-card">
          <div className="section-heading">
            <div>
              <h2>Dados do cliente</h2>
              <p>Essas informações serão exibidas no orçamento.</p>
            </div>
          </div>
          <div className="form-grid">
            <label className="field field-wide" htmlFor="customer-name">
              <span>Nome</span>
              <input
                id="customer-name"
                type="text"
                name="name"
                placeholder="Nome do cliente"
                value={customerData.name}
                onChange={handleCustomerDataChange}
              />
            </label>
            <label className="field" htmlFor="customer-document">
              <span>CNPJ ou CPF</span>
              <input
                id="customer-document"
                type="text"
                name="cnpj"
                maxLength={18}
                value={formatCnpjCpf(customerData.cnpj)}
                onChange={handleCustomerDataChange}
                placeholder="00.000.000/0000-00"
              />
            </label>
            <label className="field" htmlFor="customer-phone">
              <span>Telefone</span>
              <input
                id="customer-phone"
                type="tel"
                name="phone"
                maxLength={15}
                value={formatPhone(customerData.phone)}
                onChange={handleCustomerDataChange}
                placeholder="(00) 00000-0000"
              />
            </label>
          </div>
        </section>

        <section className="form-card">
          <div className="section-heading section-heading-inline">
            <div>
              <h2>Itens do orçamento</h2>
              <p>Adicione os produtos ou serviços que serão cobrados.</p>
            </div>
            <span className="item-counter">{items.length} {items.length === 1 ? "item" : "itens"}</span>
          </div>
          <div className="item-form-grid">
            <label className="field field-description" htmlFor="item-description">
              <span>Descrição</span>
              <textarea
                id="item-description"
                className="textareaDescription"
                placeholder="Descreva o item ou serviço"
                value={itemDescription}
                onChange={handleItemNameChange}
              />
            </label>
            <label className="field" htmlFor="item-quantity">
              <span>Quantidade</span>
              <input
                id="item-quantity"
                type="number"
                min="1"
                placeholder="0"
                value={itemQuantity}
                onChange={handleItemQuantityChange}
              />
            </label>
            <label className="field" htmlFor="item-color">
              <span>Cor</span>
              <input
                id="item-color"
                type="text"
                placeholder="Ex.: Fumê"
                value={itemColor}
                onChange={handleItemPriceChange}
              />
            </label>
          </div>
          <div className="item-form-actions">
            {editingIndex === -1 ? (
              <button className="button add" onClick={addItem} type="button">
                Adicionar item
                <span className="icon"><FaPaperPlane /></span>
              </button>
            ) : (
              <div className="box-confirm-edit">
                <button className="button save-edit" onClick={saveItem} type="button">
                  Salvar alterações
                  <span className="icon"><FaCheck /></span>
                </button>
                <button className="button cancel-edit" onClick={cancelEdit} type="button">
                  Cancelar
                  <span className="icon"><MdCancel /></span>
                </button>
              </div>
            )}
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Quantidade</th>
                  <th>Cor</th>
                  <th aria-label="Ações">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td className="empty-state" colSpan="4">Nenhum item adicionado ainda.</td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index}>
                      <td data-label="Descrição">{item.description}</td>
                      <td data-label="Quantidade">{item.quantity}</td>
                      <td data-label="Cor">{item.color}</td>
                      <td data-label="Ações">
                        <div className="box-item-actions">
                          <button className="button edit" onClick={() => editItem(index)} type="button">
                            Editar <span className="icon"><FaEdit /></span>
                          </button>
                          <button className="button delete" onClick={() => deleteItem(index)} type="button">
                            Excluir <span className="icon"><FaTrash /></span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="form-card summary-card">
          <div className="section-heading">
            <div>
              <h2>Finalização</h2>
              <p>Inclua observações, valor e as formas de pagamento.</p>
            </div>
          </div>
          <div className="summary-grid">
            <label className="field" htmlFor="observations">
              <span>Observações</span>
              <textarea
                id="observations"
                className="textareaFooterObservation"
                value={observations}
                onChange={handleObservationsChange}
                placeholder="Condições, prazos ou detalhes importantes"
              />
            </label>
            <div className="amount-column">
              <label className="field" htmlFor="total-amount">
                <span>Valor total do orçamento</span>
                <input
                  id="total-amount"
                  className="input-totalAmount"
                  type="text"
                  value={totalAmount}
                  onChange={handleTotalAmountChange}
                  placeholder="R$ 0,00"
                />
              </label>
              <label className="payment-details-option">
                <input
                  className="payment-details-checkbox"
                  type="checkbox"
                  checked={includePaymentDetails}
                  onChange={(e) => setIncludePaymentDetails(e.target.checked)}
                />
                <span className="payment-details-switch" aria-hidden="true" />
                <span className="payment-details-option-content">
                  <span className="payment-details-option-title">Incluir formas de pagamento</span>
                  <span className="payment-details-option-description">Exibe dados bancários e Pix no PDF.</span>
                </span>
              </label>
            </div>
          </div>
        </section>

        <button className="button generate-pdf" onClick={generatePDF} type="button">
          Gerar orçamento em PDF
          <span className="icon"><FaFilePdf /></span>
        </button>
      </main>
    </div>
  );
};

export default PDFGenerator;
